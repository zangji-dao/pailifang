/**
 * OnlyOffice 变量绑定插件
 * 用于在合同模板中插入和管理变量标记
 */

// 全局变量
let variables = [];
let activeVariable = null;

// 初始化插件
window.Asc.plugin.init = function () {
  console.log("[VariableBinding] Plugin initialized");

  // 监听外部 window message
  window.addEventListener("message", function(event) {
    console.log("[VariableBinding] Window message received:", event.data);
    
    if (event.data && event.data.type === "onExternalPluginMessage") {
      var pluginData = event.data.data;
      if (pluginData) {
        if (pluginData.type === "insertVariable") {
          insertVariableToDocument(pluginData.data);
        } else if (pluginData.type === "scanVariables") {
          scanDocumentVariables();
        }
      }
    }
  });

  // 文档加载完成后自动扫描内容控件
  window.Asc.plugin.onDocumentReady = function() {
    console.log("[VariableBinding] Document ready, scanning content controls...");
    setTimeout(function() {
      scanDocumentVariables();
    }, 1000);
  };
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

      case "scanVariables":
        // 扫描文档中所有内容控件
        scanDocumentVariables();
        break;

      default:
        console.warn("[VariableBinding] Unknown message type:", message.type);
    }
  } catch (error) {
    console.error("[VariableBinding] Error parsing message:", error);
  }
};

// 扫描文档中所有内容控件，返回 Tag 列表
function scanDocumentVariables() {
  console.log("[VariableBinding] Scanning document for content controls...");
  
  window.Asc.plugin.executeMethod("GetAllContentControls", null, function(result) {
    console.log("[VariableBinding] GetAllContentControls result:", result);
    
    const keys = [];
    
    if (Array.isArray(result)) {
      for (var i = 0; i < result.length; i++) {
        var control = result[i];
        var tag = control.Tag || control.tag || "";
        if (tag) {
          keys.push(tag);
        }
      }
    }
    
    console.log("[VariableBinding] Found content control tags:", keys);
    
    // 通过 postMessage 将结果发送回父窗口
    window.parent.postMessage({
      type: "scanVariablesResult",
      data: {
        keys: keys,
        count: keys.length
      }
    }, "*");
  });
}

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
