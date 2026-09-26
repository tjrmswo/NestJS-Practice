# 매핑 타입 (Mapped types)

[← 개념 문서 목록](../../README.md#개념-문서)

## 왜 필요한가

수정 요청은 바꿀 필드만 보내면 되므로 생성용 DTO와 모양이 조금 다릅니다. DTO를 복사해 따로 만들면 필드가 바뀔 때마다 두 곳을 고쳐야 합니다. 기존 DTO에서 필요한 변형(모든 속성을 선택으로 만들기, 일부 속성 제외)을 뽑아 쓰면 중복이 사라집니다.

## 개념과 실제 적용

| 개념 | Cats 도메인 적용 |
| --- | --- |
| `PartialType()`: 모든 속성을 선택(optional)으로 만든 타입 | 수정할 때 `name`만 보내도 통과합니다. |
| `OmitType()`: 지정한 속성을 뺀 타입 | 수정 대상 id는 URL 파라미터로 받으므로 본문 DTO에서 `id`를 제외했습니다. |
| 두 함수는 `@nestjs/mapped-types`에서 가져옴 | `import { OmitType, PartialType } from '@nestjs/mapped-types'` |
| 클래스 상속으로 기본 DTO 재사용 | `CreateCatDto extends CatDto`. 모든 필드가 필수입니다. |

## 구현하며 확인한 점

변형한 `UpdateCatDto`에서도 검증 규칙이 유지됩니다. 앱을 실행해 확인한 결과입니다.

| 요청 | 응답 |
| --- | --- |
| `PUT /cats/1` `{"name": "나비-수정"}` | 200. 보낸 `name`만 바뀌고 나머지 필드는 그대로입니다. |
| `PUT /cats/1` `{"state": "이상한값"}` | 400. `state must be one of the following values: 입양, 키우는 중` |
| `PUT /cats/1` `{"name": 123}` | 400. `name must be a string` |

## 코드

```ts
// src/cats/dto/cats.dto.ts (발췌)
export class UpdateCatDto extends PartialType(
  OmitType(CatDto, ['id'] as const),
) {}

export class CreateCatDto extends CatDto {}
```

## 참고 문서

- [NestJS 한글 문서](https://nestjs.burt.pe.kr/) 홈에서 `Techniques › Validation` 메뉴의 Mapped types 부분
