# NestJS Practice

NestJS로 REST API를 직접 구현하면서 익힌 개념을 정리한 프로젝트입니다. `cats` 도메인을 기준으로, 각 개념이 **왜 필요한지**, 공식 문서의 **개념 설명**과 이 프로젝트에 **실제로 적용한 방식**이 어떻게 대응되는지 비교해서 정리했습니다.

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
src/
├── main.ts                  # 앱 진입점, 전역 ValidationPipe 등록
└── cats/
    ├── cats.module.ts       # 모듈: 컨트롤러·프로바이더 등록
    ├── cats.controller.ts   # 컨트롤러: 라우팅
    ├── cat.service.ts       # 프로바이더: 비즈니스 로직 + 인메모리 저장소
    └── dto/
        └── cats.dto.ts      # DTO + 검증 규칙
```

---

## 개념별 정리: 개념 vs 실제 적용

각 절은 **왜 필요한가 → 개념과 실제 적용 비교 → 코드 → 참고 문서** 순서입니다. 표의 왼쪽은 공식 문서가 설명하는 개념, 오른쪽은 이 프로젝트의 `cats` 도메인에 적용한 내용입니다. "구현하며 확인한 점"은 직접 만들면서 겪고 확인한 내용입니다.

### 1. 모듈 (Module)

**왜 필요한가** — NestJS는 파일을 자동으로 스캔하지 않고, 모듈에 명시적으로 등록된 컨트롤러와 프로바이더만 인식합니다. 모듈은 한 기능(여기서는 cats)에 필요한 조각을 하나로 묶는 조립 단위입니다.

| 개념 | Cats 도메인 적용 |
| --- | --- |
| `controllers`: 모듈이 처리할 컨트롤러 | `controllers: [CatsController]`로 등록해야 `/cats` 라우트가 생성됩니다. |
| `providers`: 모듈 안에서 주입 가능한 프로바이더 | `providers: [CatsService]` |
| `exports`: 다른 모듈에 공개할 프로바이더 | `exports: [CatsService]`로 공개했습니다. 아직 다른 모듈에서 주입해 쓰는 곳은 없습니다. |
| 루트 모듈(`AppModule`)의 `imports`로 모듈 트리를 연결 | `CatsModule`은 `AppModule`에 직접 등록하지 않고 `TodosModule`의 `imports`를 통해 간접적으로 로드됩니다. |

**구현하며 확인한 점** — 컨트롤러와 서비스 파일을 만들어도 모듈의 `controllers`/`providers`에 등록하지 않으면 라우트가 존재하지 않아, 어떤 요청을 보내도 404가 됩니다.

```ts
// src/cats/cats.module.ts
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

참고: [NestJS 한글 문서](https://nestjs.burt.pe.kr/) `Overview › Modules` · [영문 원문](https://docs.nestjs.com/modules)

### 2. 컨트롤러 (Controller)

**왜 필요한가** — 컨트롤러는 HTTP 요청을 받아 알맞은 핸들러에 연결하고 응답을 돌려주는 계층입니다. 로직은 서비스에 위임하고 컨트롤러는 얇게 유지하면, 검증·테스트·교체가 쉬워집니다.

| 개념 | Cats 도메인 적용 |
| --- | --- |
| `@Controller('cats')`: 라우트 접두사로 핸들러를 그룹화 | 모든 핸들러가 `/cats` 아래로 묶입니다. |
| `@Get()`, `@Post()`, `@Put()`, `@Delete()`: HTTP 메서드 데코레이터 | 조회 `GET /cats`, `GET /cats/:id` / 생성 `POST /cats/create` / 수정 `PUT /cats/:id` / 삭제 `DELETE /cats/:id` |
| `@Param()`, `@Body()`: 라우트 파라미터와 요청 본문 추출 | `@Param('id', ParseIntPipe) id`, `@Body() updateCatDto` |
| `@HttpCode()`: 응답 상태 코드 지정 | 삭제 성공 시 본문 없이 `@HttpCode(204)` |

**구현하며 확인한 점** — `@Body()`를 빠뜨린 인자는 값이 주입되지 않아 컨트롤러와 서비스 양쪽에서 `undefined`가 됩니다. 타입 표기만으로는 아무 값도 채워지지 않습니다.

```ts
// src/cats/cats.controller.ts (발췌)
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCatDto: UpdateCatDto,
  ) {
    return this.catsService.update(id, updateCatDto);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteOne(@Param('id', ParseIntPipe) id: number) {
    this.catsService.delete(id);
  }
}
```

참고: [NestJS 한글 문서](https://nestjs.burt.pe.kr/) `Overview › Controllers` · [영문 원문](https://docs.nestjs.com/controllers)

### 3. 프로바이더와 의존성 주입 (Provider & DI)

**왜 필요한가** — 객체를 직접 `new`로 만들지 않고 컨테이너가 생성해 주입하면 클래스 사이의 결합도가 낮아지고, 테스트에서 대체하기도 쉬워집니다. 프로바이더는 기본적으로 싱글턴이라 인스턴스 하나가 앱 전체에서 공유되므로, 서비스 필드에 상태를 둘 수 있습니다.

| 개념 | Cats 도메인 적용 |
| --- | --- |
| `@Injectable()`: 컨테이너가 관리하는 클래스 표시 | `CatsService`에 붙였습니다. |
| 생성자 주입: 타입을 보고 의존성을 해석 | `constructor(private readonly catsService: CatsService) {}` |
| 모듈의 `providers`에 등록해야 주입 가능 | `CatsModule`의 `providers: [CatsService]` |
| 기본 스코프는 싱글턴 (앱 전체에 인스턴스 1개) | `private readonly cats` 필드가 요청 사이에 유지되어 인메모리 저장소 역할을 합니다. 서버를 재시작하면 초기 데이터 5건으로 돌아갑니다. |

**구현하며 확인한 점** — `cats`는 `readonly`라 다른 배열로 재할당할 수는 없지만 내용은 바꿀 수 있습니다. 저장하려면 `push`, `splice`, `Object.assign`처럼 원본을 직접 바꾸는 메서드를 써야 합니다. `concat`, `filter`는 새 배열을 반환할 뿐 원본을 바꾸지 않아서, 응답에는 반영돼 보여도 다시 조회하면 그대로였습니다.

```ts
// src/cats/cat.service.ts (발췌)
@Injectable()
export class CatsService {
  private readonly cats: CatDto[] = [
    /* 초기 데이터 5건 */
  ];

  update(id: number, updateCatDto: UpdateCatDto) {
    const cat = this.cats.find((d) => d.id === id);
    if (!cat) {
      throw new NotFoundException(`Cat #${id} not found`);
    }

    Object.assign(cat, updateCatDto); // 배열 안의 객체를 직접 수정
    return cat;
  }

  delete(id: number) {
    const index = this.cats.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Not Found #${id}`);
    }
    this.cats.splice(index, 1); // 원본 배열에서 제거
  }
}
```

참고: [NestJS 한글 문서](https://nestjs.burt.pe.kr/) `Overview › Providers`, `Fundamentals › Injection scopes` · 영문 원문 [Providers](https://docs.nestjs.com/providers), [Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes)

### 4. DTO와 유효성 검사 (Validation)

**왜 필요한가** — TypeScript의 타입은 컴파일 시점에만 존재해서, 런타임에 들어오는 JSON 값은 타입만으로 막을 수 없습니다. `state: '입양' | '키우는 중'`이라고 선언해도 다른 문자열이 그대로 통과합니다. 런타임 검증이 필요하고, 이를 위해 DTO 클래스에 검증 데코레이터를 붙이고 `ValidationPipe`를 등록합니다.

| 개념 | Cats 도메인 적용 |
| --- | --- |
| DTO: 요청 데이터의 형태를 정의하는 클래스 | `CatDto`, `CreateCatDto`, `UpdateCatDto` |
| 검증 데코레이터 (`class-validator`) | `@IsInt()` id, `@IsString()` name·pet, `@IsIn(CAT_STATES)` state |
| `ValidationPipe`로 요청 본문을 검증 (`class-validator`, `class-transformer` 필요) | `main.ts`에서 `app.useGlobalPipes(new ValidationPipe())`로 전역 적용 |
| 검증 실패 시 400 응답과 사유 메시지 | 예: `state must be one of the following values: 입양, 키우는 중` |
| `whitelist`: 검증 데코레이터가 없는 속성을 제거, `forbidNonWhitelisted`: 그런 속성이 있으면 요청을 거부 | **미적용**. 정의하지 않은 필드도 그대로 통과합니다. (`{"hacked": true}`를 함께 보내면 저장·조회됨을 확인) |

**구현하며 확인한 점** — 허용값 배열 `CAT_STATES`를 `as const`로 선언하고 여기서 타입(`state`)을 뽑아, 타입과 `@IsIn` 검증값이 항상 같은 출처를 쓰도록 했습니다.

```ts
// src/cats/dto/cats.dto.ts (발췌)
export const CAT_STATES = ['입양', '키우는 중'] as const;
export type state = (typeof CAT_STATES)[number];

export class CatDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  pet: string;

  @IsIn(CAT_STATES)
  state: state;
}
```

```ts
// src/main.ts (발췌)
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe());
```

참고: [NestJS 한글 문서](https://nestjs.burt.pe.kr/) `Techniques › Validation` · [영문 원문](https://docs.nestjs.com/application/validation)

### 5. 매핑 타입 (Mapped types)

**왜 필요한가** — 수정 요청은 바꿀 필드만 보내면 되므로 생성용 DTO와 모양이 조금 다릅니다. DTO를 복사해 따로 만들면 필드가 바뀔 때마다 두 곳을 고쳐야 합니다. 기존 DTO에서 필요한 변형(선택 속성으로 만들기, 일부 속성 제외)을 뽑아 쓰면 중복이 사라집니다.

| 개념 | Cats 도메인 적용 |
| --- | --- |
| `PartialType()`: 모든 속성을 선택(optional)으로 만든 타입 | 수정 시 `name`만 보내도 통과합니다. |
| `OmitType()`: 지정한 속성을 뺀 타입 | 수정 대상 id는 URL 파라미터로 받으므로 본문 DTO에서 `id`를 제외했습니다. |
| 두 함수는 `@nestjs/mapped-types`에서 가져옴 | `import { OmitType, PartialType } from '@nestjs/mapped-types'` |
| 클래스 상속으로 기본 DTO 재사용 | `CreateCatDto extends CatDto`: 모든 필드가 필수입니다. |

**구현하며 확인한 점** — 변형한 `UpdateCatDto`에서도 검증 규칙이 유지되어, 잘못된 `state`나 문자열이 아닌 `name`을 보내면 400이 반환됩니다.

```ts
// src/cats/dto/cats.dto.ts (발췌)
export class UpdateCatDto extends PartialType(
  OmitType(CatDto, ['id'] as const),
) {}

export class CreateCatDto extends CatDto {}
```

참고: [NestJS 한글 문서](https://nestjs.burt.pe.kr/) `Techniques › Validation` · [영문 원문](https://docs.nestjs.com/application/validation) (Mapped types 절)

### 6. 파이프 (Pipe)

**왜 필요한가** — 파이프는 핸들러에 값이 전달되기 전에 변환하거나 검증합니다. 라우트 파라미터(`/cats/1`의 `1`)는 항상 문자열로 들어오므로, 숫자로 비교하려면 먼저 변환해야 합니다.

| 개념 | Cats 도메인 적용 |
| --- | --- |
| 내장 `ParseIntPipe`: 문자열을 정수로 변환하고, 실패하면 400 | `@Param('id', ParseIntPipe) id: number`. `GET /cats/abc`는 `Validation failed (numeric string is expected)`와 함께 400을 반환합니다. |
| 전역 파이프(`useGlobalPipes`): 앱 전체 핸들러에 적용 | 4번 절의 `ValidationPipe`를 전역으로 등록했습니다. |

**구현하며 확인한 점** — `ParseIntPipe` 없이 `@Param('id') id: number`로만 받으면 타입은 `number`여도 실제 값은 문자열 `"1"`입니다. `d.id === id`(숫자와 문자열 비교)가 항상 `false`가 되어 조회에 실패합니다.

참고: [NestJS 한글 문서](https://nestjs.burt.pe.kr/) `Overview › Pipes` · [영문 원문](https://docs.nestjs.com/pipes)

### 7. 예외 처리 (Exception)

**왜 필요한가** — 에러 상황을 HTTP 상태 코드로 표현하는 표준 방법입니다. 서비스에서 예외를 던지면(`throw`) Nest의 내장 예외 처리 계층이 알맞은 상태 코드의 응답으로 바꿔 줍니다.

| 개념 | Cats 도메인 적용 |
| --- | --- |
| 내장 HTTP 예외 `NotFoundException` → 404 | 조회·수정·삭제 대상이 없을 때 (`Cat #999 not found`) |
| 내장 HTTP 예외 `ConflictException` → 409 | 생성 시 같은 id가 이미 있을 때 |
| 예외는 `throw`해야 예외 처리 계층이 동작 | 서비스에서 `throw new ...`로 던지고, 컨트롤러는 별도 처리 없이 응답이 만들어집니다. |

**구현하며 확인한 점** — 예외를 `return new ConflictException(...)`처럼 반환하면 던진 것이 아니므로 예외 처리 계층을 거치지 않습니다. 상태 코드는 201이 나가고, 예외 객체가 응답 본문으로 그대로 직렬화됩니다.

```ts
// src/cats/cat.service.ts (발췌)
create(cat: CatDto) {
  // ...
  if (validation) {
    throw new ConflictException('conflict!');
  }

  this.cats.push(cat);
  return this.cats;
}
```

참고: [NestJS 한글 문서](https://nestjs.burt.pe.kr/) `Overview › Exception filters` · [영문 원문](https://docs.nestjs.com/exception-filters) (Built-in HTTP exceptions 절)

---

## 참고 문서

한글 문서는 공식 문서를 한글로 번역해 공개한 [NestJS 한글 문서](https://nestjs.burt.pe.kr/)를 기준으로 했습니다. NestJS 팀이 운영하는 공식 사이트(docs.nestjs.com)가 아닌 번역본이라 최신 내용과 다를 수 있습니다. 이 사이트는 페이지별 직접 링크를 지원하지 않아(홈이 아닌 주소로 바로 접속하면 404) 홈에서 메뉴를 따라 이동해야 하므로, 표에 메뉴 경로를 적었습니다. 메뉴 위치도 최신 공식 문서와 다를 수 있습니다. 예를 들어 Validation은 한글 문서에서는 `Techniques`, 최신 영문 문서에서는 `Application` 아래에 있습니다.

| 개념 | 한글 문서 (홈에서 메뉴로 이동) | 영문 공식 문서 |
| --- | --- | --- |
| 모듈 | `Overview › Modules` | [docs.nestjs.com/modules](https://docs.nestjs.com/modules) |
| 컨트롤러 | `Overview › Controllers` | [docs.nestjs.com/controllers](https://docs.nestjs.com/controllers) |
| 프로바이더 · 의존성 주입 | `Overview › Providers` | [docs.nestjs.com/providers](https://docs.nestjs.com/providers) |
| 주입 스코프 (싱글턴) | `Fundamentals › Injection scopes` | [docs.nestjs.com/fundamentals/injection-scopes](https://docs.nestjs.com/fundamentals/injection-scopes) |
| DTO · 유효성 검사 · 매핑 타입 | `Techniques › Validation` | [docs.nestjs.com/application/validation](https://docs.nestjs.com/application/validation) |
| 파이프 | `Overview › Pipes` | [docs.nestjs.com/pipes](https://docs.nestjs.com/pipes) |
| 예외 처리 | `Overview › Exception filters` | [docs.nestjs.com/exception-filters](https://docs.nestjs.com/exception-filters) |
