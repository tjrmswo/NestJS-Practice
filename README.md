# NestJS Practice

NestJS로 REST API를 직접 구현하면서 익힌 개념을 정리한 프로젝트입니다. `cats` 도메인을 기준으로, 각 개념이 왜 필요한지와 공식 문서의 개념 설명이 이 프로젝트에 실제로 어떻게 적용됐는지를 비교해 정리했습니다. 자세한 내용은 [개념 문서](#개념-문서)의 카테고리별 문서에 있습니다.

> 이 문서는 직접 구현한 `cats` 도메인만 다룹니다. `todos`는 Nest CLI(`nest g resource`)로 생성한 코드라 제외했습니다.

## 기술 스택

- NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- TypeScript
- `class-validator`, `class-transformer`, `@nestjs/mapped-types`
- 저장소: 메모리 배열 (DB 미연결)
- 패키지 매니저: pnpm

## 실행 방법

```bash
pnpm install
pnpm run start:dev   # http://localhost:3000
```

요청은 `src/test.http`(VS Code REST Client)나 curl로 확인할 수 있습니다.

```bash
curl http://localhost:3000/cats
curl -X POST http://localhost:3000/cats/create \
  -H 'Content-Type: application/json' \
  -d '{"id":6,"name":"루루","pet":"쓰다듬기","state":"입양"}'
curl -X PUT http://localhost:3000/cats/1 \
  -H 'Content-Type: application/json' \
  -d '{"name":"나비-수정"}'
curl -X DELETE http://localhost:3000/cats/1
```

## Cats API

| Method | Path | 설명 | 성공 응답 | 실패 응답 |
| --- | --- | --- | --- | --- |
| GET | `/cats` | 전체 조회 | 200, 목록 | - |
| GET | `/cats/:id` | 단건 조회 | 200, 객체 | 400(id가 숫자 아님), 404 |
| POST | `/cats/create` | 생성 | 201, 추가 후 전체 목록 | 400(검증 실패), 409(id 중복) |
| PUT | `/cats/:id` | 부분 수정 | 200, 수정된 객체 | 400(검증 실패), 404 |
| DELETE | `/cats/:id` | 삭제 | 204, 본문 없음 | 400, 404 |

| 필드 | 타입 | 규칙 |
| --- | --- | --- |
| `id` | number | 정수 (생성 시 필수, 수정 시 본문에서 제외) |
| `name` | string | 문자열 |
| `pet` | string | 문자열 |
| `state` | string | `'입양'` 또는 `'키우는 중'` 중 하나 |

## 프로젝트 구조

```
.
├── docs/                        # 개념별 상세 문서
│   ├── module/
│   ├── controller/
│   ├── provider-di/
│   ├── validation/
│   ├── mapped-types/
│   ├── pipe/
│   └── exception/
└── src/
    ├── main.ts                  # 앱 진입점, 전역 ValidationPipe 등록
    └── cats/
        ├── cats.module.ts       # 모듈: 컨트롤러·프로바이더 등록
        ├── cats.controller.ts   # 컨트롤러: 라우팅
        ├── cat.service.ts       # 프로바이더: 비즈니스 로직 + 인메모리 저장소
        └── dto/
            └── cats.dto.ts      # DTO + 검증 규칙
```

## 개념 문서

각 문서는 **왜 필요한가 → 개념과 실제 적용 비교 → 구현하며 확인한 점 → 코드 → 참고 문서** 순서입니다. 카테고리마다 폴더가 나뉘어 있어, 개념이 늘어나면 `docs/` 아래에 폴더를 추가해 확장할 수 있습니다.

| 카테고리 | 다루는 내용 | 문서 |
| --- | --- | --- |
| 모듈 (Module) | `controllers`/`providers`/`exports` 등록, 모듈 트리 | [docs/module](docs/module/README.md) |
| 컨트롤러 (Controller) | 라우팅 데코레이터, `@Param`/`@Body`, 상태 코드 | [docs/controller](docs/controller/README.md) |
| 프로바이더와 의존성 주입 | `@Injectable`, 생성자 주입, 싱글턴, 인메모리 저장소 | [docs/provider-di](docs/provider-di/README.md) |
| DTO와 유효성 검사 | `class-validator`, `ValidationPipe`, 검증 실패 응답 | [docs/validation](docs/validation/README.md) |
| 매핑 타입 (Mapped types) | `PartialType`, `OmitType`로 DTO 재사용 | [docs/mapped-types](docs/mapped-types/README.md) |
| 파이프 (Pipe) | `ParseIntPipe`, 전역 파이프 | [docs/pipe](docs/pipe/README.md) |
| 예외 처리 (Exception) | `NotFoundException`, `ConflictException`, `throw`와 `return`의 차이 | [docs/exception](docs/exception/README.md) |

## 참고 문서

각 문서의 참고 문서는 [NestJS 한글 문서](https://nestjs.burt.pe.kr/)를 기준으로 합니다. NestJS 팀이 운영하는 공식 사이트(docs.nestjs.com)가 아닌 번역본이라 최신 내용과 다를 수 있습니다. 이 사이트는 페이지별 직접 링크를 지원하지 않아(홈이 아닌 주소로 바로 접속하면 404) 홈에서 메뉴를 따라 이동해야 하므로, 문서마다 메뉴 경로(예: `Overview › Modules`)를 적었습니다. 메뉴는 번역 시점의 구조를 따르며 최신 공식 문서와 위치가 다를 수 있습니다.
