/**
 * OnlyOffice 变量绑定插件
 * 用于在合同模板中插入和管理变量标记
 */

// 全局变量
let variables = [];
let activeVariable = null;

// 初始化插件
window.Asc.plugin.init = function () {
  // 插件初始化逻辑
  console.log("[VariableBinding] Plugin initialized");

  // 发送消息给父窗口请求变量列表
  window.Asc.plugin.sendToPlugin("getVariables");
};

// 接收消息
window.Asc.plugin.onMessage = function (data) {
  console.log("[VariableBinding] Received message:", data);

  try {
    const message = typeof data === "string" ? JSON.parse(data) : data;

    switch (message.type) {
      case "variables":
        // 接收变量列表
        variables = message.data || [];
        updateVariablesList();
        break;

      case "insertVariable":
        // 插入变量
        activeVariable = message.data;
        insertVariableToDocument(activeVariable);
        break;

      case "highlightVariable":
        // 高亮显示变量
        highlightVariableInDocument(message.data);
        break;

      default:
        console.warn("[VariableBinding] Unknown message type:", message.type);
    }
  } catch (error) {
    console.error("[VariableBinding] Error parsing message:", error);
  }
};

// 插入变量到文档
function insertVariableToDocument(variable) {
  if (!variable) {
    console.warn("[VariableBinding] No variable to insert");
    return;
  }

  // 使用内容控件 API 插入变量标记
  window.Asc.plugin.executeMethod("InsertAndReplaceContentControls", [
    {
      Props: {
        Id: Math.floor(Math.random() * 1000000),
        Tag: variable.key || variable.name,
        Lock: 0, // 可编辑
        Appearance: 1, // 高亮显示
        Color: {
          r: 220,
          g: 253,
          b: 231,
        },
      },
      Value: `{{${variable.name}}}`,
    },
  ]);

  console.log("[VariableBinding] Inserted variable:", variable);
}

// 高亮显示文档中的变量
function highlightVariableInDocument(variable) {
  if (!variable) return;

  // 查找并高亮指定的内容控件
  window.Asc.plugin.executeMethod("GetCurrentContentControl", null, function (
    result
  ) {
    console.log("[VariableBinding] Current content control:", result);
  });
}

// 更新变量列表 UI
function updateVariablesList() {
  const container = document.getElementById("variables-container");
  if (!container) return;

  container.innerHTML = "";

  if (variables.length === 0) {
    container.innerHTML =
      '<div class="empty-state">暂无变量，请先在系统中创建变量</div>';
    return;
  }

  variables.forEach(function (variable) {
    const item = document.createElement("div");
    item.className = "variable-item";
    item.setAttribute("data-key", variable.key || variable.name);
    item.innerHTML = `
      <div class="variable-name">${variable.name}</div>
      <div class="variable-key">${variable.key || variable.name}</div>
      <button class="insert-btn" data-key="${variable.key || variable.name}">
        插入
      </button>
    `;

    // 点击插入按钮
    item.querySelector(".insert-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      insertVariableToDocument(variable);
    });

    container.appendChild(item);
  });
}

// 插件按钮点击事件
window.Asc.plugin.button = function (id) {
  console.log("[VariableBinding] Button clicked:", id);

  switch (id) {
    case 0: // 主按钮 - 打开变量面板
      // 面板已经在 variations 中配置
      break;

    default:
      window.Asc.plugin.executeCommand("close", "");
  }
};

// 插件命令处理
window.Asc.plugin.onCommand = function (command) {
  console.log("[VariableBinding] Command received:", command);
};

// 内容控件变化事件
window.Asc.plugin.attachEvent("onChangeContentControl", function (data) {
  console.log("[VariableBinding] Content control changed:", data);
});

// 文档内容变化事件
window.Asc.plugin.attachEvent("onChangeDocumentContent", function (data) {
  console.log("[VariableBinding] Document content changed:", data);
});
