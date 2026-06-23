# Microsoft To Do-only MCP

Microsoft To Do를 읽기 전용으로만 가져오는 아주 얇은 MCP 래퍼입니다. 내부적으로 Softeria의 [`@softeria/ms-365-mcp-server`](https://github.com/Softeria/ms-365-mcp-server)를 실행하되, To Do 조회 도구와 `Tasks.Read` 권한만 노출합니다.

## 노출 도구

- `list-todo-task-lists`
- `list-todo-tasks`
- `get-todo-task`
- `list-todo-linked-resources`

## 빠른 시작

`.env.example`을 `.env`로 복사합니다.

```bash
cp .env.example .env
```

처음 한 번 로그인합니다. Microsoft device-code 페이지가 Chrome 시크릿 새 창으로 열리고, 코드는 클립보드에도 복사됩니다.

```bash
npm run login
```

로그인 계정 캐시를 확인합니다.

```bash
npm run verify
```

권한이 `Tasks.Read` 하나만 남는지 확인합니다.

```bash
npm run permissions
```

MCP 서버를 stdio 모드로 실행합니다.

```bash
npm start
```

## MCP 클라이언트 설정 예시

`mcp.example.json`의 절대 경로를 본인 로컬 경로로 바꿔서 MCP 클라이언트 설정에 붙이면 됩니다.

```json
{
  "mcpServers": {
    "ms-todo": {
      "command": "node",
      "args": [
        "/absolute/path/to/ms-todo-only-mcp/bin/ms-todo-mcp.mjs"
      ]
    }
  }
}
```

## AI/Codex로 설치하기

다른 사람에게는 아래 프롬프트를 그대로 전달해도 됩니다.

```text
이 저장소를 Microsoft To Do MCP로 설정해 주세요.

1. 저장소 루트에서 `.env.example`을 `.env`로 복사해 주세요.
2. `.env` 값은 아래처럼 유지해 주세요.

MS365_MCP_CLIENT_ID=6d381e43-6641-4a91-a452-d9352244d2b2
MS365_MCP_TENANT_ID=consumers

3. `.env`와 토큰 캐시는 커밋하거나 공유하지 마세요.
4. `npm run permissions`로 `Tasks.Read`만 요청하는지 확인해 주세요.
5. `npm run login`을 실행하고, 사용자가 Microsoft device-code 로그인 페이지에서 직접 로그인/동의하게 안내해 주세요.
6. 로그인 뒤 `npm start`로 MCP 서버를 실행할 수 있게 해 주세요.

주의: client id는 public client id라 secret이 아닙니다. client secret은 만들거나 요구하지 마세요.
```

## 생산성 다마고치로 쓰기

Microsoft To Do를 데이터 소스로 사용해서 오늘 할 일 상태를 펫의 말투로 피드백받을 수 있습니다. MCP 연결 뒤 [prompts/productivity-pet.md](prompts/productivity-pet.md)의 프롬프트를 Claude, Codex, 또는 MCP를 지원하는 AI에 붙여넣으세요.

바로 쓰는 요청 예시:

```text
Microsoft To Do에서 오늘 할 일을 확인해서 생산성 다마고치 모드로 피드백해줘.

내 자기평가:
- 집중도 4/10
- 피로도 6/10
```

## 설정

기본 `.env.example`은 개인 Microsoft 계정용입니다.

```env
MS365_MCP_CLIENT_ID=6d381e43-6641-4a91-a452-d9352244d2b2
MS365_MCP_TENANT_ID=consumers
```

이 client id는 public client id라 비밀이 아닙니다. 실제 access token, refresh token, 로컬 token cache는 절대 공유하면 안 됩니다.

기본 브라우저로 device-code 페이지를 열고 싶다면 `.env`에 다음을 추가합니다.

```env
MS_TODO_MCP_BROWSER=default
```

특정 계정만 허용하려면 다음을 추가할 수 있습니다.

```env
MS365_MCP_EXPECTED_USERNAME=you@example.com
```

## 참고

Softeria의 `--verify-login`은 내부적으로 Microsoft Graph `/me`를 호출합니다. 이 프로젝트는 최소 권한을 위해 `User.Read`를 요청하지 않으므로 `/me` 검증은 403이 날 수 있습니다. 대신 `npm run verify`는 캐시된 계정 목록만 확인합니다.

Microsoft Graph의 To Do API는 목록 조회에 `GET /me/todo/lists`, 특정 목록의 태스크 조회에 `GET /me/todo/lists/{todoTaskListId}/tasks`를 씁니다. Softeria 서버에는 이미 이 엔드포인트들이 선언되어 있어서, 직접 인증과 Graph 호출을 다시 구현하지 않고 도구 필터와 권한 필터만 씌우는 방식으로 유지합니다.

- Softeria MCP server: https://github.com/Softeria/ms-365-mcp-server
- Microsoft Graph To Do API: https://learn.microsoft.com/en-us/graph/api/resources/todo-overview
