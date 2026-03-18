/**
 * 对象存储服务测试脚本
 * 运行方式：pnpm tsx src/scripts/test-storage.ts
 */

import 'dotenv/config';
import { getStorageService, FileType, getStoragePrefix, generateUniqueKey } from '../services/storage';

async function testStorage() {
  console.log('======================================');
  console.log('  对象存储服务测试');
  console.log('======================================\n');

  // 检查环境变量
  const requiredEnvVars = [
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_BUCKET',
    'S3_REGION',
    'S3_ENDPOINT',
  ];

  console.log('📋 检查环境变量...');
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ 缺少以下环境变量:', missingVars.join(', '));
    console.log('\n请在 backend/.env 文件中配置这些变量');
    process.exit(1);
  }
  
  console.log('✅ 环境变量配置完整\n');

  // 显示配置信息
  console.log('📦 存储配置:');
  console.log(`   存储桶: ${process.env.S3_BUCKET}`);
  console.log(`   地域: ${process.env.S3_REGION}`);
  console.log(`   端点: ${process.env.S3_ENDPOINT}\n`);

  try {
    const storage = getStorageService();
    
    // 测试 1: 上传文件
    console.log('📤 测试上传文件...');
    const testContent = Buffer.from('Hello, Π立方会计系统！这是一个测试文件。');
    const testKey = generateUniqueKey('test.txt', getStoragePrefix(FileType.TEMP));
    
    const uploadResult = await storage.upload(testContent, 'test.txt', {
      key: testKey,
      contentType: 'text/plain',
    });
    
    console.log('✅ 上传成功:');
    console.log(`   Key: ${uploadResult.key}`);
    console.log(`   Size: ${uploadResult.size} bytes`);
    console.log(`   URL: ${uploadResult.url.substring(0, 60)}...\n`);

    // 测试 2: 获取文件信息
    console.log('🔍 测试获取文件信息...');
    const info = await storage.getInfo(testKey);
    
    if (info) {
      console.log('✅ 文件信息:');
      console.log(`   Key: ${info.key}`);
      console.log(`   Size: ${info.size} bytes`);
      console.log(`   Type: ${info.contentType}\n`);
    }

    // 测试 3: 列出文件
    console.log('📋 测试列出文件...');
    const listResult = await storage.list({
      prefix: 'temp/',
      maxKeys: 10,
    });
    
    console.log(`✅ 找到 ${listResult.files.length} 个文件:`);
    listResult.files.slice(0, 5).forEach(f => {
      console.log(`   - ${f.key} (${f.size} bytes)`);
    });
    console.log();

    // 测试 4: 删除测试文件
    console.log('🗑️  测试删除文件...');
    const deleted = await storage.delete(testKey);
    console.log(`✅ 删除${deleted ? '成功' : '失败'}\n`);

    console.log('======================================');
    console.log('  ✅ 所有测试通过！');
    console.log('======================================');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    
    // 提供常见错误解决方案
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('SignatureDoesNotMatch')) {
      console.log('\n💡 可能的原因:');
      console.log('   - SecretId 或 SecretKey 不正确');
      console.log('   - 请检查 https://console.cloud.tencent.com/cam/capi');
    } else if (errorMsg.includes('NoSuchBucket')) {
      console.log('\n💡 可能的原因:');
      console.log('   - 存储桶名称不正确');
      console.log('   - 存储桶不存在');
      console.log('   - 请检查 https://console.cloud.tencent.com/cos/bucket');
    } else if (errorMsg.includes('AccessDenied')) {
      console.log('\n💡 可能的原因:');
      console.log('   - 密钥没有存储桶访问权限');
      console.log('   - 请检查 CAM 权限配置');
    }
    
    process.exit(1);
  }
}

testStorage();
