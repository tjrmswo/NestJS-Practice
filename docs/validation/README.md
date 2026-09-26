# DTO와 유효성 검사 (Validation)

[← 개념 문서 목록](../../README.md#개념-문서)

## 왜 필요한가

TypeScript의 타입은 컴파일 시점에만 존재해서, 런타임에 들어오는 JSON 값은 타입만으로 막을 수 없습니다. `state: '입양' | '키우는 중'`이라고 선언해도 다른 문자열이 그대로 통과합니다. 런타임 검증이 필요하고, 이를 위해 DTO 클래스에 검증 데코레이터를 붙이고 `ValidationPipe`를 등록합니다.

## 개념과 실제 적용

| 개념 | Cats 도메인 적용 |
| --- | --- |
| DTO: 요청 데이터의 형태를 정의하는 클래스 | `CatDto`, `CreateCatDto`, `UpdateCatDto` |
| 검증 데코레이터 (`class-validator`) | `@IsInt()` id, `@IsString()` name·pet, `@IsIn(CAT_STATES)` state |
| `ValidationPipe`로 요청 본문을 검증 (`class-validator`, `class-transformer` 필요) | `main.ts`에서 `app.useGlobalPipes(new ValidationPipe())`로 전역 적용 |
| 검증 실패 시 400 응답과 사유 메시지 | 아래 "검증 실패 응답" 참고 |
| `whitelist`: 검증 데코레이터가 없는 속성을 제거, `forbidNonWhitelisted`: 그런 속성이 있으면 요청을 거부 | **미적용**. 정의하지 않은 필드도 그대로 통과합니다. |

## 검증 실패 응답

앱을 실제로 실행해 요청한 결과입니다.

| 요청 | 응답 |
| --- | --- |
| `POST /cats/create` 본문이 `{}` | 400. `id must be an integer number`, `name must be a string`, `pet must be a string`, `state must be one of the following values: 입양, 키우는 중` |
| `POST /cats/create` `state`가 허용값이 아님 | 400. `state must be one of the following values: 입양, 키우는 중` |
| `PUT /cats/1` `{"name": 123}` | 400. `name must be a string` |
| `POST /cats/create` 정의하지 않은 `hacked: true`를 함께 전송 | 201. `hacked`도 함께 저장되고 조회됩니다 (`whitelist` 미적용) |

## 구현하며 확인한 점

- 허용값 배열 `CAT_STATES`를 `as const`로 선언하고 여기서 타입(`state`)을 뽑아, 타입과 `@IsIn` 검증값이 항상 같은 출처를 쓰도록 했습니다.
- `whitelist`를 전역으로 켜려면 그 앱의 모든 DTO에 검증 데코레이터가 있어야 합니다. 데코레이터가 없는 속성은 제거 대상이 되기 때문입니다.

## 코드

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

## 참고 문서

- [NestJS 한글 문서](https://nestjs.burt.pe.kr/) 홈에서 `Techniques › Validation` 메뉴
