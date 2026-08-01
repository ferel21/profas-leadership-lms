const fs = require('fs');
const path = '/home/keyra/.gemini/config/mcp_config.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const token = data.mcpServers['hostinger-hosting'].env.HOSTINGER_API_TOKEN;

// Create the new config
const newConfig = {
  mcpServers: {
    "hostinger-api": {
      "command": "hostinger-api-mcp",
      "args": [],
      "env": {
        "HOSTINGER_API_TOKEN": token,
        "PATH": "/usr/local/bin:/usr/bin:/bin:/home/keyra/.nvm/versions/node/v24.18.1/bin:/home/keyra/.bun/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/games:/usr/local/games:/snap/bin"
      }
    }
  }
};

fs.writeFileSync(path, JSON.stringify(newConfig, null, 2));
console.log('Updated mcp_config.json');
