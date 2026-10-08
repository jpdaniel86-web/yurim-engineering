# 유림엔지니어링(주) 홈페이지

Node.js 22 이상으로 실행하는 독립형 홈페이지입니다. 외부 npm 패키지 설치 없이 동작합니다. `public/`의 이미지·동영상·다운로드 자료를 서버가 직접 제공하고, `src/render.mjs`가 각 메뉴 페이지의 HTML을 만듭니다.

## 로컬 실행

```powershell
npm start
```

브라우저에서 `http://localhost:8080`을 엽니다. `npm test`로 문의 API, 입력 검증, 저장, 파일 접근 및 동영상 구간 요청을 확인합니다. `npm run dev`는 서버 파일 변경 시 자동 재시작합니다.

## 기존 GitHub 저장소

기존 저장소 URL과 사용할 브랜치가 정해지면 이 폴더의 파일을 해당 저장소에 반영합니다. 기존 파일과 충돌하는 내용은 비교한 뒤 반영해야 합니다. `data/`, `.env` 및 관리자 토큰은 Git에 올리지 않습니다. 홈페이지 정적 자료는 `public/downloads/`에 두며 방문자가 다운로드할 수 있습니다.

## 기존 Fly.io 앱 배포

`fly.toml.example`을 `fly.toml`로 복사하고 `app`을 기존 앱 이름으로 변경합니다. 기존 앱의 현재 리전, 볼륨 이름 및 다른 서비스 설정을 먼저 확인한 뒤 맞춰야 합니다. `fly config save --app EXISTING_APP_NAME`으로 기존 설정을 내려받아 비교할 수 있습니다. 예시는 도쿄 리전 `nrt`와 단일 Machine 구성을 사용합니다. [Fly.io 앱 설정 문서](https://docs.fly.io/reference/configuration)

`fly deploy`를 실행하기 전에 아래 관리자 토큰 생성·설정을 먼저 완료합니다.

```powershell
fly status --app EXISTING_APP_NAME
fly volumes list --app EXISTING_APP_NAME
fly volumes create yurim_data --region nrt --size 1 --app EXISTING_APP_NAME
fly deploy --app EXISTING_APP_NAME --ha=false
```

이미 `yurim_data` 볼륨이 있으면 새로 생성하지 않습니다. 개인 정보를 저장하므로 볼륨은 필요합니다. Docker 진입 스크립트는 root 권한으로 `/data` 디렉터리 자체의 소유자를 UID/GID 1000으로 맞춘 뒤 즉시 `node` 사용자로 전환해 서버를 실행합니다. 기존 파일을 재귀적으로 바꾸지 않습니다. 기존 앱에서 다른 사용자로 썼던 문의 파일이면 해당 파일의 소유권을 별도로 확인해야 합니다. Docker의 `DATA_DIR`은 `/data`만 허용하며 서버는 시작할 때 쓰기 권한을 검사합니다. 볼륨 없이 컨테이너 내부에 저장한 문의는 Machine 교체 시 유실될 수 있습니다. [Fly.io 볼륨 문서](https://docs.fly.io/volumes/overview)

관리자 토큰은 충분히 긴 임의 값으로 생성하고 Fly secrets로 보관합니다. 운영 모드(`NODE_ENV=production`)는 32~512자의 공백 없는 ASCII 관리자 토큰을 반드시 요구하며, 설정이 없거나 잘못되면 시작하지 않습니다. PowerShell에서 토큰을 화면에 출력하지 않고 설정하려면 다음 명령을 사용합니다. 생성한 실제 토큰을 Git, README 또는 채팅에 붙여 넣지 마세요.

```powershell
$yurimAdminToken = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
fly secrets set "ADMIN_TOKEN=$yurimAdminToken" --app EXISTING_APP_NAME
Remove-Variable yurimAdminToken
```

`PUBLIC_ORIGIN` 또는 `SITE_URL`을 설정하면 문의 API의 브라우저 Origin을 지정한 도메인으로 제한합니다. 두 설정이 있으면 `PUBLIC_ORIGIN`이 우선합니다. 한 앱에 여러 정상 도메인을 연결할 때는 이 값을 비워 두면 현재 요청 도메인을 기준으로 검증합니다. 정상적인 동일 도메인의 브라우저 요청과 Origin이 없는 서버 API 요청은 허용합니다.

기존 앱을 업데이트하는 배포이므로 현재 사용 중인 서비스 및 볼륨과 충돌하지 않는지 확인하고 실행해야 합니다. 이 예시는 새 앱을 자동 생성하거나 기존 앱을 삭제하지 않습니다.

## 문의 접수 및 관리자 확인

`POST /api/inquiries`는 JSON으로 아래 필드를 받습니다. 유형 값은 `construction`, `management`, `iot` 중 하나입니다.

```json
{
  "type": "construction",
  "name": "홍길동",
  "company": "문의 회사",
  "phone": "010-1234-5678",
  "message": "현장 조건에 맞는 처리 설비 상담을 요청합니다.",
  "consent": true,
  "website": ""
}
```

문의는 `DATA_DIR/inquiries.jsonl`에 접수 시각과 동의 정보와 함께 저장됩니다. 전화번호·문의 내용은 서버 로그에 출력하지 않습니다. 최대 요청 크기는 32KB이고, 전화번호 및 내용 길이를 서버에서도 검증합니다. 동일 IP는 15분 동안 5회까지 접수할 수 있습니다. Fly 환경에서는 `Fly-Client-IP`를 사용합니다. 단일 프로세스 메모리 기반의 접수 횟수 제한이므로 Machine 재시작 시 초기화됩니다.

관리자 확인은 `GET /api/inquiries`에 `Authorization: Bearer ADMIN_TOKEN` 헤더를 전송합니다. 개발 모드에서 유효한 관리자 토큰이 없으면 조회는 HTTP 503으로 비활성화됩니다. 별도 메일 발송은 연동되어 있지 않으므로 운영자는 관리자 조회 또는 서버의 접수 파일을 확인해야 합니다. 접수 파일이 16MB를 넘으면 서버에서 직접 관리하도록 API 목록 조회를 중단합니다. 정상 접수번호와 HTTP 201은 파일 저장 및 디스크 동기화가 끝난 문의에만 반환합니다.

## 운영자 문의 관리와 보관 기간

서버에 접근할 수 있는 담당자는 내장 CLI로 접수를 관리합니다. Fly 서버에서는 `fly ssh console --app EXISTING_APP_NAME`으로 접속한 뒤 `/app`에서 실행합니다. `DATA_DIR=/data`가 적용됩니다. 로컬에서는 기본 `data/` 또는 `--data-dir`으로 지정한 폴더를 사용합니다.

```sh
node scripts/manage-inquiries.mjs list
node scripts/manage-inquiries.mjs export --out /tmp/private-inquiries.csv
node scripts/manage-inquiries.mjs complete INQUIRY_ID
node scripts/manage-inquiries.mjs delete INQUIRY_ID
node scripts/manage-inquiries.mjs prune --completed-days 365
node scripts/manage-inquiries.mjs prune --completed-days 365 --apply
```

`INQUIRY_ID`는 목록이나 관리자 API의 실제 접수번호로 바꿉니다. `complete`는 상담 완료 시각을 기록합니다. `prune`은 기본적으로 상담 완료 후 365일이 지난 기록만 선택하고, `--apply`가 있어야 삭제합니다. 완료 처리하지 않은 기록은 자동으로 삭제하지 않습니다. 접수 시각을 기준으로 정리하려면 담당자가 기준을 확인한 뒤 `--received-days DAYS`를 별도로 지정할 수 있습니다. `delete`는 지정한 접수번호 1건을 삭제합니다.

목록에는 접수번호·접수 시각·분야·완료 시각만 표시합니다. 내보내기 파일에는 연락처와 문의 내용이 포함됩니다. 기존 파일을 덮어쓰지 않고 파일 권한은 600으로 만들며, 공개 `public/` 폴더에 내보내는 작업은 거부합니다. CSV는 한글 Excel 표시를 위한 UTF-8 BOM, 필드 따옴표 처리 및 수식 실행 방지 처리를 적용합니다. 내보낸 파일의 접근 권한과 보관·삭제도 담당자가 관리해야 합니다.

서버 접수와 CLI 수정은 동일한 파일 잠금을 사용하고, 삭제·완료 처리는 임시 파일을 디스크에 동기화한 뒤 원본을 교체합니다. 서버를 강제 종료하는 중 잠금 파일이 남았으면 먼저 해당 서버와 관리 작업이 모두 멈췄는지 확인한 후 `DATA_DIR/.inquiries.lock`만 제거합니다. 실행 중인 잠금을 임의로 삭제하면 동시 수정 보호가 깨집니다.

개인정보 처리방침에 맞는 보관 기간, 접근 권한 및 삭제 절차를 정하고 운영해야 합니다. Fly 볼륨은 여러 Machine에 공유되는 저장소가 아니므로 이 구성은 단일 Machine 기준입니다. 다중 Machine 운영이 필요하면 접수 저장을 공용 데이터베이스로 교체하세요. 자동 볼륨 스냅샷만으로 최신 데이터 백업을 보장하지 않으므로 별도의 백업 절차가 필요합니다. [Fly.io 볼륨 문서](https://docs.fly.io/volumes/overview) 자동 정지 설정으로 장시간 미접속 후 첫 요청은 앱 시작을 기다릴 수 있습니다. [Fly.io 앱 설정 문서](https://docs.fly.io/reference/configuration)

## 서버 환경 변수

| 이름 | 기본값 | 용도 |
| --- | --- | --- |
| `PORT` | `8080` | HTTP 포트 |
| `HOST` | `0.0.0.0` | 바인딩 주소 |
| `DATA_DIR` | 프로젝트의 `data/` | 문의 접수 파일 저장 위치 |
| `ADMIN_TOKEN` | 개발 시 없음 | 관리자 조회 인증, 운영 시 32~512자 필수 |
| `PUBLIC_ORIGIN` / `SITE_URL` | 없음 | 문의 폼의 허용 Origin |
| `NODE_ENV` | 환경 기본값 | `production`에서 HSTS 적용 |

`GET /healthz`는 서버 상태를 반환합니다. MP4 정적 파일은 HTTP byte range 및 HEAD 요청을 지원합니다. 개발 모드는 정적 파일을 `no-cache`로 재검증하며 운영 모드는 1시간 캐시합니다. CSS·JS를 업데이트할 때는 버전 쿼리도 변경하세요. SIGTERM/SIGINT 수신 시 진행 중인 요청과 파일 저장을 마치고 종료합니다.
