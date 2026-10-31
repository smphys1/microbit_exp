# 학번·이름 접속과 공개 배포

학생은 첫 화면에서 학번과 이름을 입력하고 **탐구노트 시작하기**를 누릅니다. 계정 생성, Google/ChatGPT 로그인, 학생 비밀번호는 없습니다. 교사는 접속 화면의 **교사 채점**을 누르고 별도 교사용 코드를 입력합니다.

## 학생 정보와 제출

- 학번은 숫자 1~20자리, 이름은 50자 이내로 입력합니다. 학번 앞의 0은 보존합니다.
- 입력 양끝 공백과 유니코드 표현을 정리한 **학번·이름 조합**으로 제출을 구분합니다. 같은 학번이라도 다른 이름을 입력하면 다른 기록입니다.
- 다시 같은 정보로 접속한 뒤 **최근 제출 불러오기**를 누르면 이전 제출을 불러옵니다. 최초 접속 시 만든 정보가 보고서와 제출에 자동 반영됩니다.
- **나가기 / 학생 변경**을 누르면 접속 쿠키를 지우고 처음 화면으로 돌아갑니다. 기기 내 초안은 학생 정보 조합별로 구분해 보관합니다. 공용 기기에서는 작성 백업 후 사이트 데이터를 정리하세요.
- 서버 접속 세션은 8시간 유지됩니다. 서버 키를 변경하면 기존 세션이 모두 무효화됩니다.

**학번과 이름은 본인 확인 수단이 아닙니다.** 다른 사람의 학번·이름을 입력하면 그 사람의 제출물·첨부 파일·공개된 평가를 보고 재제출할 수 있습니다. 세션 쿠키의 서명은 쿠키 변조를 막는 용도이며 이 한계를 해결하지 않습니다. 명부 확인이나 추가 비밀 정보는 요구하지 않습니다.

기존 Sites/Google 계정 ID로 저장된 제출물은 새 학번·이름 조합과 자동 연결하지 않습니다. 이전 데이터가 있으면 백업 후 교사가 확인한 매핑으로 별도 이전해야 합니다. 기존 브라우저의 공용 초안 저장 키도 새 학생별 초안으로 자동 복사하지 않습니다.

## 로컬 개발

Node.js 24와 `package.json`에 지정된 pnpm을 사용합니다. 기존 `.dev.vars`가 있으면 보존하고 필요한 항목만 추가하세요. `.dev.vars.example`을 새 `.dev.vars`로 복사해 아래 항목을 채웁니다.

| 변수 | 내용 |
| --- | --- |
| `APP_URL` | 로컬에서는 `http://127.0.0.1:5173`, 운영에서는 공개 앱의 HTTPS origin |
| `AUTH_SESSION_SECRET` | 안전한 생성기로 만든 32바이트 이상의 서버 전용 무작위 키 |
| `TEACHER_KEY` | 교사용 접속 코드 |

학생에게 서버 비밀 키를 입력받지 않습니다. 기존 `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET`은 사용하지 않습니다.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

새 로컬 D1 데이터베이스에만 초기 SQL을 한 번 적용합니다. 기존 데이터베이스에는 중복 적용하지 않습니다.

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mighty_mac_gargan.sql
pnpm dev
```

`.dev.vars`를 바꾼 뒤 개발 서버를 재시작합니다. 앱 주소와 `APP_URL`의 origin이 같아야 접속됩니다.

## Cloudflare 공개 배포

GitHub Pages는 현재 기존 ChatGPT Sites로 이동하는 정적 진입 페이지입니다. **학생 로그인 코드를 제거해도 Sites 자체의 접속 제한은 바뀌지 않습니다.** 계정 없는 학생에게 배포하려면 앱 서버를 공개 Cloudflare Workers로 배포한 다음 Pages의 이동 주소를 바꿉니다. D1과 R2도 필요합니다.

Cloudflare 인증이 가능한 개발 컴퓨터에서 계정의 Workers 하위 도메인을 확인하고 다음 작업을 진행합니다.

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create microbit-inquiry-school
pnpm exec wrangler r2 bucket create microbit-inquiry-school-files
```

다음 공개 설정을 실제 값으로 바꿔 지정합니다. D1 생성 결과의 실제 UUID와 Workers 계정의 하위 도메인을 사용하세요.

```sh
export CF_WORKER_NAME=microbit-inquiry-school
export CF_D1_DATABASE_ID=실제-D1-데이터베이스-UUID
export CF_R2_BUCKET_NAME=microbit-inquiry-school-files
export APP_URL=https://실제-공개-앱-주소
pnpm build
pnpm deploy:prepare
```

`deploy:prepare`는 비밀 값을 포함하지 않는 `dist/server/wrangler.production.json`을 생성합니다. 빌드 후에는 매번 이 명령을 다시 실행하세요. 새 운영 DB에만 초기 SQL을 한 번 적용한 뒤 배포합니다.

```sh
pnpm exec wrangler d1 execute DB --remote --config dist/server/wrangler.production.json --file drizzle/0000_mighty_mac_gargan.sql
pnpm exec wrangler deploy --config dist/server/wrangler.production.json
pnpm exec wrangler secret put AUTH_SESSION_SECRET --config dist/server/wrangler.production.json
pnpm exec wrangler secret put TEACHER_KEY --config dist/server/wrangler.production.json
```

`secret put`은 비밀 값을 대화형 입력합니다. 값은 저장소·채팅·명령 인자에 기록하지 않습니다. Cloudflare 대시보드의 Worker → Settings → Variables and Secrets에서도 Secret으로 설정할 수 있습니다. 새 D1/R2를 만들면 기존 Sites의 데이터와 첨부 파일은 자동 복사되지 않습니다.

공개 주소에서 학번·이름 접속, 같은 정보로 재접속, 다른 학생 조합의 기록 분리, 첨부 파일 제출·다운로드, 교사 채점과 나가기를 확인합니다. 이후 `github-pages/index.html`의 meta refresh, canonical, JavaScript 이동과 대체 링크 네 곳을 새 주소로 바꾸고 GitHub Pages를 다시 배포합니다.
