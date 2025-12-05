#!/usr/bin/env node

/**
 * 测试运行器和结果总结
 * 运行所有测试并生成可读的总结报告
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n🧪 开始运行 cutImg 测试套件...\n');
console.log('='.repeat(60));

try {
  // 运行测试
  const output = execSync('npm test -- --coverage --json --outputFile=test-results.json', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'inherit',
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有测试通过！');
  console.log('='.repeat(60));

  // 读取测试结果
  const fs = require('fs');
  const resultsPath = path.join(__dirname, '../test-results.json');
  
  if (fs.existsSync(resultsPath)) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    console.log('\n📊 测试统计：');
    console.log(`  ✅ 通过: ${results.numPassedTests}`);
    console.log(`  ❌ 失败: ${results.numFailedTests}`);
    console.log(`  ⏭️  跳过: ${results.numPendingTests}`);
    console.log(`  📦 总计: ${results.numTotalTests}`);
    console.log(`  ⏱️  用时: ${(results.testResults[0]?.perfStats?.runtime / 1000).toFixed(2)}s`);
    
    console.log('\n📈 覆盖率：');
    if (results.coverageMap) {
      console.log('  查看 coverage/lcov-report/index.html 获取详细报告');
    }
  }

} catch (error) {
  console.log('\n' + '='.repeat(60));
  console.log('❌ 测试失败');
  console.log('='.repeat(60));
  process.exit(1);
}

console.log('\n✨ 测试完成！\n');
