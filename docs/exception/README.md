# 예외 처리 (Exception)

[← 개념 문서 목록](../../README.md#개념-문서)

## 왜 필요한가

에러 상황을 HTTP 상태 코드로 표현하는 표준 방법입니다. 서비스에서 예외를 던지면(`throw`) Nest의 내장 예외 처리 계층이 알맞은 상태 코드의 응답으로 바꿔 주므로, 컨트롤러에서 응답을 직접 조립할 필요가 없습니다.

## 개념과 실제 적용

| 개념 | Cats 도메인 적용 |
| --- | --- |
| 내장 HTTP 예외 `NotFoundException` → 404 | 조회·수정·삭제 대상이 없을 때 던집니다. |
| 내장 HTTP 예외 `ConflictException` → 409 | 생성 시 같은 id가 이미 있을 때 던집니다. |
| 예외는 `throw`해야 예외 처리 계층이 동작 | 서비스에서 `throw new ...`로 던지고, 컨트롤러는 별도 처리 없이 응답이 만들어집니다. |

## 응답 예시

앱을 실제로 실행해 요청한 결과입니다.

| 요청 | 응답 |
| --- | --- |
| `GET /cats/999` | 404. `{"message":"Cat #999 not found","error":"Not Found","statusCode":404}` |
| `DELETE /cats/2`를 이미 삭제한 뒤 다시 요청 | 404. `{"message":"Not Found #2","error":"Not Found","statusCode":404}` |
| `POST /cats/create` 이미 있는 `id`로 생성 | 409. `{"message":"conflict!","error":"Conflict","statusCode":409}` |

## 구현하며 확인한 점

예외를 `return new ConflictException(...)`처럼 반환하면 던진 것이 아니므로 예외 처리 계층을 거치지 않습니다. 상태 코드는 201이 나가고, 예외 객체가 응답 본문으로 그대로 직렬화됩니다. 반드시 `throw`로 던져야 합니다.

## 코드

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

## 참고 문서

- [NestJS 한글 문서](https://nestjs.burt.pe.kr/) 홈에서 `Overview › Exception filters` 메뉴
