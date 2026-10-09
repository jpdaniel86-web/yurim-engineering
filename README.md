# 유림엔지니어링(주) 홈페이지

Node.js 22 이상으로 실행하는 독립형 홈페이지입니다. 외부 npm 패키지 설치 없이 동작합니다. `public/`의 이미지·동영상·다운로드 자료를 서버가 직접 제공하고, `src/render.mjs`가 각 메뉴 페이지의 HTML을 만듭니다.

## 로컬 실행

```powershell
npm start
```

브라우저에서 `http://localhost:8080`을 엽니다. `npm test`로 문의 API, 입력 검증, 저장, 파일 접근 및 동영상 구간 요청을 확인합니다. `npm run dev`는 서버 파일 변경 시 자동 재시작합니다.

## GitHub와 배포 주소

- 홈페이지: https://yurim-engineering.fly.dev
- 비공개 GitHub 저장소: https://github.com/jpdaniel86-web/yurim-engineering
- Fly.io 앱: `yurim-engineering`, 도쿄 `nrt`, 단일 Machine
- 문의 수신: `yurimkorea@gmail.com`

`data/`, `.env` 및 관리자 토큰은 Git에 올리지 않습니다. 정적 자료는 `public/downloads/`에서 다운로드할 수 있습니다.

상세페이지 메뉴의 `Yurim UI` 글꼴은 [Pretendard v1.3.9](https://github.com/orioncactus/pretendard/tree/v1.3.9)의 가변 웹폰트를 메뉴·페이지 안내에 쓰이는 문자로 줄인 약 90KB의 로컬 파일입니다. 수정된 글꼴 이름을 별도로 지정했으며 SIL Open Font License 및 원저작권 고지는 `public/assets/fonts/OFL-Pretendard.txt`에 포함합니다. 메인 타이포그래피는 기존 Manrope와 Noto Sans KR을 유지합니다.

## Fly.io 업데이트

이 폴더의 `fly.toml`이 배포 설정입니다. 소스를 수정하고 검증한 뒤 아래 명령으로 업데이트합니다.

```powershell
node scripts/check-site.mjs
node --test tests/*.test.mjs
fly deploy --app yurim-engineering --ha=false
fly status --app yurim-engineering
```

문의 기록은 `yurim_data` 암호화 볼륨(`/data`)에 보관합니다. 기존 볼륨을 다시 생성하지 않습니다. Docker 진입 스크립트가 `/data`의 소유자를 UID/GID 1000으로 맞춘 뒤 `node` 사용자로 전환합니다. 이 앱은 한 Machine을 항상 실행해 문의 메일 재시도와 즉시 접속을 지원합니다. [Fly.io 앱 설정](https://docs.fly.io/reference/configuration), [볼륨](https://docs.fly.io/volumes/overview)

관리자 조회용 무작위 `ADMIN_TOKEN`은 Fly secrets에 설정되어 있습니다. 실제 값을 소스·Git·채팅에 기록하지 않습니다. 운영 모드는 32~512자의 공백 없는 ASCII 토큰을 요구합니다. 토큰을 새로 설정할 때는 다음 명령을 사용합니다.

```powershell
$yurimAdminToken = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
fly secrets set "ADMIN_TOKEN=$yurimAdminToken" --app yurim-engineering
Remove-Variable yurimAdminToken
```

`PUBLIC_ORIGIN`은 홈페이지의 HTTPS 주소이고 `EMAIL_TO`는 담당자 이메일입니다. 커스텀 도메인을 연결하면 `PUBLIC_ORIGIN`도 변경해야 합니다. 도메인이 여러 개이면 이 값을 비워 현재 요청 도메인을 기준으로 검증할 수 있습니다.

## 문의 접수 및 관리자 확인

`POST /api/inquiries`는 JSON 또는 HTML 폼의 URLencoded POST를 받습니다. JavaScript가 작동하면 JSON 접수 상태를 화면에서 표시하고, 작동하지 않으면 서버가 오류 입력값을 유지한 HTML이나 접수 완료 화면을 반환합니다. 폼 응답은 캐시에 저장하지 않으며 개인정보를 URL 쿼리에 넣지 않습니다. 유형 값은 `construction`, `management`, `iot` 중 하나입니다.

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

관리자 확인은 `GET /api/inquiries`에 `Authorization: Bearer ADMIN_TOKEN` 헤더를 전송합니다. 개발 모드에서 유효한 관리자 토큰이 없으면 조회는 HTTP 503으로 비활성화됩니다. 메일 전달 상태도 각 접수의 `emailForwarding` 필드에서 확인할 수 있습니다. 접수 파일이 16MB를 넘으면 서버에서 직접 관리하도록 API 목록 조회를 중단합니다. 정상 접수번호와 HTTP 201은 파일 저장 및 디스크 동기화가 끝난 문의에만 반환하며 메일 수신을 보장하는 응답은 아닙니다.

## 문의 메일 전달

운영 환경은 `EMAIL_TO=yurimkorea@gmail.com`으로 문의를 전달합니다. SMTP 계정이나 API 키 없이 FormSubmit의 HTTPS AJAX 접수 기능을 사용합니다. 서버가 먼저 문의를 저장한 뒤 FormSubmit으로 성함, 회사·기관명, 연락처, 문의 내용, 접수번호와 접수 시각을 전달합니다. `PUBLIC_ORIGIN` 또는 `SITE_URL`은 실제 홈페이지 주소로 지정합니다. Fly에서는 이 값이 없으면 `FLY_APP_NAME`의 기본 HTTPS 주소를 사용합니다. [FormSubmit 공식 AJAX 문서](https://formsubmit.co/ajax-documentation)

FormSubmit은 처음 접수할 때 수신 주소로 활성화 메일을 보냅니다. `yurimkorea@gmail.com`의 담당자가 메일의 확인 링크를 눌러야 해당 폼이 활성화됩니다. 미활성화 접수는 서비스가 최대 30일 보관하며 활성화 후 전달한다고 안내합니다. 확인 메일이 보이지 않으면 스팸함을 확인합니다. 수신 주소를 변경하면 새 주소에 다시 활성화가 필요합니다. [FormSubmit 공식 도움말](https://formsubmit.co/help)

홈페이지의 접수 완료 메시지는 서버 저장 완료를 뜻합니다. FormSubmit의 성공 응답은 서비스 접수 상태로만 기록하며 Gmail 도착을 확인한 것으로 표시하지 않습니다. 모든 전송 상태의 `deliveryConfirmed`는 `false`입니다. 실제 메일 도착과 활성화는 수신함에서 확인해야 합니다.

| `emailForwarding.status` | 의미 |
| --- | --- |
| `pending` / `sending` | 전송 대기 / 요청 진행 중 |
| `accepted` | 서비스가 접수를 수락함. 활성화 여부·메일 도착은 미확인 |
| `activation_required` | 서비스 응답에 명시적인 활성화 요구가 있음. HTTP 200이어도 `success: false`일 수 있으며 접수 수락·메일 수신으로 표시하지 않음 |
| `retry` | 요청 실패로 다음 전송 대기 |
| `failed` | 최대 3회 시도 후 실패. 담당자가 저장 문의를 직접 확인해야 함 |

전송 요청은 8초 제한을 적용하고 실패 시 1분, 5분 간격으로 총 3회까지 시도합니다. 상태는 접수 파일에 남으며 1분마다 대기 기록을 확인하고 서버 재시작 때도 다시 확인합니다. Machine이 자동 정지되어 있으면 다음 시작 때 처리가 재개됩니다. 서비스가 요청을 받았지만 응답이 끊긴 경우 재시도로 중복 메일이 생길 수 있으므로 같은 접수번호로 대조합니다. 기존 접수 중 메일 전송 상태가 없는 기록은 자동으로 외부에 보내지 않습니다.

외부 서비스의 활성화·스팸 정책·장애로 메일 전달이 지연되거나 실패할 수 있습니다. 메일만으로 문의를 관리하지 말고 관리자 API 또는 문의 파일의 접수 및 전송 상태를 함께 확인하세요. 공개 개인정보 안내에는 FormSubmit 전달과 서비스 보관 기간이 포함되어 있습니다. 개발 환경은 `EMAIL_TO`가 없으면 메일을 보내지 않으며 테스트는 가짜 전송 함수만 사용합니다.

## 운영자 문의 관리와 보관 기간

서버에 접근할 수 있는 담당자는 내장 CLI로 접수를 관리합니다. Fly 서버에서는 `fly ssh console --app yurim-engineering`으로 접속한 뒤 `/app`에서 실행합니다. `DATA_DIR=/data`가 적용됩니다. 로컬에서는 기본 `data/` 또는 `--data-dir`으로 지정한 폴더를 사용합니다.

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

서버 접수와 CLI 수정은 동일한 파일 잠금을 사용하고, 삭제·완료 처리는 임시 파일을 디스크에 동기화한 뒤 원본을 교체합니다. 단일 서버 프로세스는 2분 이상 지난 잠금에서 소유 프로세스가 종료되었거나 PID가 재사용된 것이 확실할 때만 복구합니다. 최근·불명확한 잠금은 유지합니다. 복구되지 않은 잠금은 해당 서버와 관리 작업이 모두 멈췄는지 확인한 후 `DATA_DIR/.inquiries.lock`만 제거합니다. 실행 중인 잠금을 임의로 삭제하면 동시 수정 보호가 깨집니다.

개인정보 처리방침에 맞는 보관 기간, 접근 권한 및 삭제 절차를 정하고 운영해야 합니다. Fly 볼륨은 여러 Machine에 공유되는 저장소가 아니므로 이 구성은 단일 Machine 기준입니다. 다중 Machine 운영이 필요하면 접수 저장을 공용 데이터베이스로 교체하세요. 자동 볼륨 스냅샷만으로 최신 데이터 백업을 보장하지 않으므로 별도의 백업 절차가 필요합니다. [Fly.io 볼륨 문서](https://docs.fly.io/volumes/overview) 현재 설정은 최소 한 Machine을 유지합니다. [Fly.io 앱 설정 문서](https://docs.fly.io/reference/configuration)

## 서버 환경 변수

| 이름 | 기본값 | 용도 |
| --- | --- | --- |
| `PORT` | `8080` | HTTP 포트 |
| `HOST` | `0.0.0.0` | 바인딩 주소 |
| `DATA_DIR` | 프로젝트의 `data/` | 문의 접수 파일 저장 위치 |
| `ADMIN_TOKEN` | 개발 시 없음 | 관리자 조회 인증, 운영 시 32~512자 필수 |
| `PUBLIC_ORIGIN` / `SITE_URL` | 없음 | 문의 폼의 허용 Origin |
| `EMAIL_TO` | 운영: `yurimkorea@gmail.com`, 개발: 없음 | 문의 메일 수신 주소. 빈 값이면 메일 전달 비활성화 |
| `NODE_ENV` | 환경 기본값 | `production`에서 HSTS 적용 |

`GET /healthz`는 서버 상태를 반환합니다. MP4 정적 파일은 HTTP byte range 및 HEAD 요청을 지원합니다. 개발 모드는 정적 파일을 `no-cache`로 재검증하며 운영 모드는 1시간 캐시합니다. CSS·JS를 업데이트할 때는 버전 쿼리도 변경하세요. SIGTERM/SIGINT 수신 시 진행 중인 요청과 파일 저장을 마치고 종료합니다.
