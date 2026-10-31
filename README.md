# microbit_exp

고등학교 **과학탐구실험 개인 자유주제탐구**를 위한 **탐구노트 ver2** 소스입니다. 마이크로비트 측정부터 파일 제출, 보고서 PDF, 교사의 50점 평가까지 지원합니다.

- [ver2 웹앱](https://microbit-inquiry-lab-v2-dh.workspace-489790.chatgpt.site)
- [기존 ver1](https://microbit-inquiry-lab-dh.workspace-489790.chatgpt.site) — 별도로 유지됩니다.

사이트 접속 가능 범위는 Sites의 공유 설정에 따릅니다. 이 저장소에는 학생 제출물, 채점 데이터, 교사용 접속 코드가 포함되어 있지 않습니다.

## GitHub Pages에서 ver2 열기

GitHub 저장소의 **Code 화면**에는 README가 표시됩니다. 웹앱 진입 화면은 별도의 **GitHub Pages 주소**에서 열립니다.

루트의 `index.html`은 배포된 ver2 웹앱으로 자동 이동하는 진입점입니다. 자동 이동이 차단되면 화면의 **웹앱 열기** 링크를 누르세요. 로그인과 제출·채점은 기존 ver2 서버에서 처리합니다.

```text
index.html                    GitHub Pages 진입점 → 배포된 ver2로 이동
.github/workflows/pages.yml    index.html만 Pages에 배포
app/                          React 화면 및 서버 API
worker/                       Cloudflare Workers 진입점
db/, drizzle/                 D1 스키마와 마이그레이션
```

배포 방법:

1. 변경 파일을 GitHub의 `main` 브랜치에 커밋하고 푸시합니다.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
3. **Actions → Deploy ver2 entry to GitHub Pages → Run workflow**를 실행합니다. 이후 `index.html` 또는 배포 워크플로 변경을 `main`에 푸시하면 자동 배포됩니다.
4. 배포가 성공하면 `https://smphys1.github.io/microbit_exp/`를 엽니다. 이 주소에서 ver2 웹앱으로 이동합니다.

Pages 배포물에는 `index.html`과 `.nojekyll`만 포함됩니다. README, 앱 소스, 로컬 환경 변수, 데이터베이스와 업로드 파일은 포함하지 않습니다. 이 Pages 배포에는 Node.js 의존성 설치나 Cloudflare 인증이 필요하지 않습니다.

`index.html`은 ver2 앱을 정적 HTML로 변환한 파일이 아닙니다. 앱 화면 자체를 GitHub Pages에서 실행하려면 별도 프런트엔드 빌드와 서버 인증·API 연결 설계가 필요합니다. ver2 주소가 변경되면 `index.html`의 자동 이동 주소와 링크를 함께 수정하세요.

## 학생 활동

1. **주제 설정**: 센서, 측정 상황, 데이터 종류, 궁금한 점을 입력하면 한 문장 주제 초안을 제시합니다. 초안을 적용하고 수정할 수 있습니다.
2. **센서·변인 점검**: 센서별 MakeCode 코드, 조작·종속·통제 변인, 측정 간격·시간·반복을 확인합니다. 내장 빛·온도·소리(V2)·가속도·자기장 센서를 안내하며, 외부 센서는 모델별 배선·확장 기능 확인이 필요합니다.
3. **파일 첨부**: 원본 CSV와 그래프가 포함된 구글시트 XLSX를 첨부합니다. CSV는 최대 8개, 파일당 10 MB, 유지할 파일과 새 첨부를 합쳐 전체 20 MB까지 제출할 수 있습니다. 보고서용 그래프 PNG/JPG는 선택 사항입니다.
4. **보고서·최종 제출**: 동기·예상, 결과 분석, 결론, 한계·개선·출처의 네 칸을 작성합니다. 앞 단계의 주제와 실험 방법은 자동 반영됩니다. PDF를 다운로드하고, 최종 제출 버튼으로 작성 내용과 첨부 파일을 서버에 저장합니다.

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
- Sites 인증: 학생 제출을 사용자 ID별로 구분

**서버와 저장소가 필요한 웹앱입니다. GitHub Pages 같은 정적 호스팅만으로는 제출·채점 API를 실행할 수 없습니다.** GitHub 커밋과 웹사이트 배포는 별도 작업입니다.

## 개발 환경

Node.js 22.13 이상(권장 24)과 `package.json`의 `packageManager`에 지정된 pnpm을 사용합니다.

```sh
pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars
```

`.dev.vars`의 `TEACHER_KEY`를 로컬 개발용 값으로 채웁니다. 실제 배포에서는 Sites의 런타임 비밀 변수로 별도 설정합니다. 운영 접속 코드를 소스나 Git에 기록하지 않습니다.

```sh
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mighty_mac_gargan.sql
pnpm dev
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

학생 제출 API는 Sites가 전달하는 `oai-authenticated-user-id`를 사용합니다. 일반 호스팅으로 이전한다면 해당 인증 경계도 구현해야 하며, 인터넷 클라이언트가 보낸 동일 이름의 헤더를 그대로 신뢰해서는 안 됩니다. 관리 환경의 로컬 미리보기에는 실제 Sites 로그인 상태가 없을 수 있습니다.

초안은 브라우저에 자동 저장되며 JSON으로 백업할 수 있습니다. 파일 선택만으로 서버 제출이 되지 않습니다. 제출 완료 표시와 접수번호를 확인해야 합니다. PDF 다운로드도 서버 제출과 별개입니다.

## 검증

```sh
pnpm exec tsc --noEmit
node tests/submission.test.mjs
pnpm build
```

테스트는 메모리 SQLite와 테스트용 파일 저장소로 제출·첨부 파일 보존, 사용자별 접근 분리, 교사 인증, 점수 합산·검증·공개, 재제출 초기화, 제출 차수 충돌과 Origin 검사를 확인합니다. 테스트에 사용하는 식별자와 접속 코드는 기능 검증용이며 운영 데이터가 아닙니다.

## 주요 파일

- `app/page.tsx`: 학생 워크북
- `app/teacher.tsx`: 교사 채점 화면
- `app/report.tsx`, `lib/pdf.ts`: 보고서와 PDF
- `app/api/[...path]/route.ts`: 제출·파일·평가 API
- `lib/rubric.ts`: 평가 기준과 점수 검증
- `lib/sensors.ts`: 센서 안내
- `db/schema.ts`, `drizzle/`: 데이터베이스 스키마와 마이그레이션

의존성, 빌드 결과, 로컬 환경 변수, 데이터베이스와 업로드 파일은 커밋 대상에서 제외됩니다.
