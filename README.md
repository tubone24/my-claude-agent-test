

## Installation

```
# Apple Silicon用のバイナリをダウンロード（最新版）
curl -L -o cagent https://github.com/docker/cagent/releases/latest/download/cagent-darwin-arm64

chmod +x cagent

sudo mv cagent /usr/local/bin/
```

## Usage

```
cagent run basic_claude_agent.yaml
```

## Deploy on Startup

```
cagent push ./basic_claude_agent.yaml username/my-claude-agent
```