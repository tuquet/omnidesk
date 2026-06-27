const { spawn } = require('child_process');

const child = spawn('node', ['node_modules/shadcn/dist/index.js', 'mcp', '--cwd', 'packages/ui'], {
  cwd: 'd:\\Repository\\kill-bug-machine'
});

child.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test",
      version: "1.0.0"
    }
  }
};

const listToolsRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {}
};

child.stdin.write(JSON.stringify(initRequest) + '\n');
setTimeout(() => {
  child.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 500);

setTimeout(() => {
  child.kill();
}, 2000);
