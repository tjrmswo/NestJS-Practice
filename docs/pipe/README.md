# 파이프 (Pipe)

[← 개념 문서 목록](../../README.md#개념-문서)

## 왜 필요한가

파이프는 핸들러에 값이 전달되기 전에 그 값을 변환하거나 검증합니다. 라우트 파라미터(`/cats/1`의 `1`)는 항상 문자열로 들어오므로, 숫자로 비교하려면 먼저 변환해야 합니다.

## 개념과 실제 적용

| 개념 | Cats 도메인 적용 |
| --- | --- |
| 내장 `ParseIntPipe`: 문자열을 정수로 변환하고, 실패하면 400 | `@Param('id', ParseIntPipe) id: number`를 조회·수정·삭제 핸들러에 적용했습니다. |
| 전역 파이프(`useGlobalPipes`): 앱 전체 핸들러에 적용 | [유효성 검사](../validation/README.md)의 `ValidationPipe`를 전역으로 등록했습니다. |

## 동작 확인

앱을 실제로 실행해 요청한 결과입니다.

| 요청 | 응답 |
| --- | --- |
| `GET /cats/abc` | 400. `Validation failed (numeric string is expected)` |
| `GET /cats/1` | 200. `id`가 정수 `1`로 변환되어 조회됩니다. |

## 구현하며 확인한 점

`ParseIntPipe` 없이 `@Param('id') id: number`로만 받으면 타입은 `number`여도 실제 값은 문자열 `"1"`입니다. TypeScript 타입 표기는 런타임에 값을 바꾸지 않기 때문입니다. 그러면 서비스의 `d.id === id`가 숫자와 문자열 비교가 되어 항상 `false`가 되고, 조회에 실패합니다.

## 코드

```ts
// src/cats/cats.controller.ts (발췌)
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

## 참고 문서

- [NestJS 한글 문서](https://nestjs.burt.pe.kr/) 홈에서 `Overview › Pipes` 메뉴
