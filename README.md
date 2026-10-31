# microbit_exp

**ver3가 추가되었습니다.** [학생 화면](https://smphys1.github.io/microbit_exp/ver3/) · [교사 채점](https://smphys1.github.io/microbit_exp/ver3/teacher/) · [사용 안내](docs/ver3.md). 학생 제출 파일을 가져와 50점 채점·피드백 저장·CSV/백업 내보내기를 지원합니다. ver1·ver2는 기존 주소와 동작을 유지합니다. 아래 내용은 별도 표시가 없으면 ver2 설명입니다.

고등학교 **과학탐구실험 개인 자유주제탐구**를 위한 **탐구노트 ver2** 소스입니다. 마이크로비트 측정부터 파일 제출, 보고서 PDF, 교사의 50점 평가까지 지원합니다.

- [ver2 웹앱 · GitHub Pages](https://smphys1.github.io/microbit_exp/)
- [기존 ver1](https://microbit-inquiry-lab-dh.workspace-489790.chatgpt.site) — 별도로 유지됩니다.

GitHub Pages 버전은 계정 없이 공개 주소에서 바로 실행됩니다. 기존 Sites 주소의 접속 범위는 Sites 공유 설정에 따릅니다. 이 저장소에는 학생 제출물, 채점 데이터, 교사용 접속 코드가 포함되어 있지 않습니다.

학생은 첫 화면에 **학번과 이름만 입력**하면 이용할 수 있습니다. Google·ChatGPT 계정이나 학생 비밀번호는 필요하지 않습니다. GitHub Pages에서는 학생별 브라우저 초안, 보고서 PDF·JSON 저장을 제공합니다. 온라인 제출·교사 채점은 별도 서버 버전에서 제공합니다. 자세한 구분과 배포 방법은 [학번·이름 접속과 배포](docs/student-access.md)를 참고하세요.

## GitHub Pages에서 ver2 실행하기

**https://smphys1.github.io/microbit_exp/** 에서 앱이 직접 실행됩니다. 다른 사이트로 자동 이동하지 않습니다. GitHub 저장소의 Code 화면에 표시되는 README와는 별개입니다.

```text
github-pages/index.html        정적 앱 HTML 진입점
github-pages/main.tsx          React 앱 실행
vite.pages.config.ts           Pages 빌드: 하위 경로에서도 동작하는 상대 자산 URL
.github/workflows/pages.yml    빌드·검증 후 dist-pages를 Pages에 배포
app/                           두 버전이 공유하는 화면과 서버 API
worker/, db/, drizzle/         서버 버전의 Workers·D1·R2
```

| 기능 | GitHub Pages 버전 | 서버 버전 |
| --- | --- | --- |
| 학번·이름 입력, 탐구 작성, 센서 안내 | 지원 | 지원 |
| 파일 선택, 그래프 미리보기, PDF·JSON 저장 | 지원 | 지원 |
| 같은 브라우저의 학생별 초안 복원 | 지원 | 지원 |
| 온라인 제출, 서버 파일 보관, 교사 채점 | 미지원 | 지원 |

Pages에서는 PDF·원본 CSV·XLSX를 교사가 안내한 제출 경로로 전달합니다. 파일 선택만으로 전송되지 않습니다. 기기를 바꿀 때는 JSON 백업을 내려받아 옮기며, 새로고침 후 첨부 파일은 다시 선택합니다. 서버 API를 호출하거나 제출 완료로 표시하지 않습니다.

배포 방법:

1. 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정합니다.
2. `main`에 푸시하면 **Deploy inquiry apps to GitHub Pages**가 의존성 설치·타입 검사·테스트·정적 빌드를 실행하고 배포합니다.
3. 수동 실행은 **Actions → Deploy inquiry apps to GitHub Pages → Run workflow → main**에서 할 수 있습니다.
4. 배포 성공 후 위 Pages 주소를 엽니다. 기존 이동 화면이 보이면 새로고침하거나 시크릿 창에서 확인하세요.

개발 중에는 `pnpm dev`로 GitHub Pages와 같은 앱을 바로 엽니다. 외부 미리보기 연결을 위해 모든 인터페이스에서 5173번 포트를 사용하며 `terminal.local` 호스트를 허용합니다. 서버 세션이나 `.dev.vars`는 필요하지 않습니다.

완성 빌드의 미리보기:

```sh
pnpm install --frozen-lockfile
pnpm build:pages
pnpm preview:pages
```

미리보기 첫 주소에서 앱이 바로 열립니다(4173번 포트). 배포와 같은 하위 경로를 확인할 때는 `pnpm preview:pages --base /microbit_exp/`로 실행합니다.

생성된 `dist-pages/`만 배포합니다. 서버 코드·로컬 환경 변수·데이터베이스·업로드 파일은 배포물에 포함하지 않습니다. Pages 실행에는 `APP_URL`, 서버 비밀 키나 Cloudflare 계정이 필요하지 않습니다. `.dev.vars`는 서버 버전에만 사용합니다.

## 학생 활동

1. **주제 설정**: 센서, 측정 상황, 데이터 종류, 궁금한 점을 입력하면 한 문장 주제 초안을 제시합니다. 초안을 적용하고 수정할 수 있습니다.
2. **센서·변인 점검**: 센서별 MakeCode 코드, 조작·종속·통제 변인, 측정 간격·시간·반복을 확인합니다. 내장 빛·온도·소리(V2)·가속도·자기장 센서를 안내하며, 외부 센서는 모델별 배선·확장 기능 확인이 필요합니다.
3. **파일 첨부**: 원본 CSV와 그래프가 포함된 구글시트 XLSX를 첨부합니다. CSV는 최대 8개, 파일당 10 MB, 유지할 파일과 새 첨부를 합쳐 전체 20 MB까지 제출할 수 있습니다. 보고서용 그래프 PNG/JPG는 선택 사항입니다.
4. **보고서·파일 저장 / 서버 제출**: 동기·예상, 결과 분석, 결론, 한계·개선·출처의 네 칸을 작성합니다. 앞 단계의 주제와 실험 방법은 자동 반영됩니다. PDF와 JSON 백업을 다운로드합니다. 서버 버전에서는 최종 제출 버튼으로 작성 내용과 첨부 파일을 서버에 저장합니다.

구글시트 안내에는 A1의 `sep=` 내용 삭제(해당 값이 있을 때), A2·B2 머리글 입력, A2부터 데이터 영역 선택, 삽입 → 차트, 차트 유형·X축·계열·제목·축 제목 수정과 XLSX 내보내기가 포함됩니다. 실제 CSV 열 구조와 시간 단위를 먼저 확인해야 합니다.

내장 빛 센서의 0–255는 조도(lx), 내장 소리 센서의 0–255는 소음(dB)이 아닙니다. 물리 단위 기준과 직접 비교하지 않습니다.

## 평가 기준과 교사 화면

| 영역 | 배점 | 채점 방식 |
| --- | ---: | --- |
| 주제 설정 | 10 | 5개 항목 × 2/1/0점 |
| 데이터·시각화 파일 | 10 | CSV 5항목 + 시트·그래프 5항목, 충족 시 각 1점 |
| 보고서 | 30 | 질문·예상 4, 실험 방법 6, 분석 8, 결론 8, 한계·개선·출처 4 |

교사 화면에서 학생별 제출 내용을 보고 항목별 점수를 선택합니다. 첨부 파일 다운로드, CSV 앞 25행 미리보기, 점수 자동 합산, 피드백 저장, 학생 공개 여부 선택, 채점 결과 CSV 내보내기를 지원합니다. 재제출하면 기존 채점이 초기화되며, 이전 제출 차수에 대한 채점 저장을 막습니다. 파일 존재나 학생의 자기 점검만으로 탐구의 질을 자동 판정하지 않습니다.

## 기술 구성

- React / TypeScript / Vinext / Vite
- Cloudflare Workers 런타임
- D1 `DB`: 제출 내용, 파일 메타데이터, 채점 결과
- R2 `BUCKET`: CSV, XLSX, 그래프 이미지
- jsPDF / html2canvas: 한글 보고서 PDF 생성
- 학번·이름 입력과 서명된 접속 세션: 학생별 제출 구분

작성·PDF 저장은 GitHub Pages에서 실행됩니다. 온라인 제출·채점 API는 Workers·D1·R2가 있는 서버 버전에서만 실행됩니다. GitHub 커밋과 웹사이트 배포 성공은 별도로 확인해야 합니다.

## 서버 버전 개발 환경

Node.js 22.13 이상(권장 24)과 `package.json`의 `packageManager`에 지정된 pnpm을 사용합니다.

```sh
pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars
```

`.dev.vars`의 `TEACHER_KEY`, `APP_URL`, `AUTH_SESSION_SECRET`을 로컬 개발용 값으로 채웁니다. 세션 서명 키는 32바이트 이상의 무작위 서버 전용 값이며 학생에게 입력받지 않습니다. Google OAuth 등록이나 학교 관리자 승인은 필요하지 않습니다. 실제 배포에서는 Cloudflare Workers 설정에 별도 등록합니다. 운영 비밀 값을 소스나 Git에 기록하지 않습니다.

```sh
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mighty_mac_gargan.sql
pnpm dev:server
```

위 SQL은 새 로컬 데이터베이스에 한 번만 적용합니다. 이후 스키마 변경은 다음 명령으로 추가 마이그레이션을 생성하고 순서대로 적용합니다.

```sh
pnpm db:generate
```

Sites 관리 환경에서는 해당 환경의 미리보기·배포 도구를 사용합니다. 다른 환경에서는 `pnpm dev`가 출력하는 URL로 접속합니다. 기본 템플릿의 개발·빌드·런타임 스크립트와 `.openai/hosting.json`은 보존되어 있습니다.

### 환경 변수와 인증

| 이름 | 역할 |
| --- | --- |
| `TEACHER_KEY` | 교사용 평가 API 접속 코드. 서버 비밀 변수이며 클라이언트 번들에 포함하지 않음 |
| `DB` | D1 바인딩 |
| `BUCKET` | R2 바인딩 |
| `APP_URL` | 공개 앱의 HTTPS origin. 로컬 개발에서는 `http://127.0.0.1:5173` |
| `AUTH_SESSION_SECRET` | 32바이트 이상의 무작위 서버 세션 서명 키 |

학생 제출 API는 학번·이름 입력 후 발급한 세션 쿠키로 현재 학생을 구분하며 `oai-authenticated-user-id` 헤더는 사용하지 않습니다. 제출물의 학번·이름은 서버가 접속 정보로 채워 폼의 다른 값으로 바꿀 수 없게 합니다. 세션 서명은 쿠키 변조를 막을 뿐 입력자의 실제 신원을 확인하지 않습니다. 교사 기능은 별도 접속 코드로 보호됩니다. 이전 Google/Sites 제출 소유자는 새 학번·이름과 자동 연결되지 않습니다.

초안은 브라우저에 자동 저장되며 JSON으로 백업할 수 있습니다. 파일 선택만으로 서버 제출이 되지 않습니다. 제출 완료 표시와 접수번호를 확인해야 합니다. PDF 다운로드도 서버 제출과 별개입니다.

## 검증

```sh
pnpm exec tsc --noEmit
pnpm test
pnpm build:pages
pnpm build
```

테스트는 메모리 SQLite와 테스트용 파일 저장소로 제출·첨부 파일 보존, 사용자별 접근 분리, 교사 인증, 점수 합산·검증·공개, 재제출 초기화, 제출 차수 충돌과 Origin 검사를 확인합니다. 테스트에 사용하는 식별자와 접속 코드는 기능 검증용이며 운영 데이터가 아닙니다.

접속 테스트는 학번·이름 입력, 공백·문자 정규화, 같은 정보로 재접속, 잘못된 입력·다른 출처 요청 차단, 세션 변조·만료·헤더 위조 거부와 나가기를 확인합니다. 브라우저 초안도 학번·이름 조합별로 분리해 저장합니다.

## 주요 파일

- `app/page.tsx`: 학생 워크북
- `app/teacher.tsx`: 교사 채점 화면
- `app/report.tsx`, `lib/pdf.ts`: 보고서와 PDF
- `app/api/[...path]/route.ts`: 제출·파일·평가 API
- `lib/rubric.ts`: 평가 기준과 점수 검증
- `lib/sensors.ts`: 센서 안내
- `db/schema.ts`, `drizzle/`: 데이터베이스 스키마와 마이그레이션

의존성, 빌드 결과, 로컬 환경 변수, 데이터베이스와 업로드 파일은 커밋 대상에서 제외됩니다.
