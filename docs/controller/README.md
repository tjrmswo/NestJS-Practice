# 컨트롤러 (Controller)

[← 개념 문서 목록](../../README.md#개념-문서)

## 왜 필요한가

컨트롤러는 HTTP 요청을 받아 알맞은 핸들러에 연결하고 응답을 돌려주는 계층입니다. 비즈니스 로직은 서비스에 위임하고 컨트롤러는 라우팅과 값 추출만 맡아 얇게 유지하면, 검증·테스트·교체가 쉬워집니다.

## 개념과 실제 적용

| 개념 | Cats 도메인 적용 |
| --- | --- |
| `@Controller('cats')`: 라우트 접두사로 핸들러를 그룹화 | 모든 핸들러가 `/cats` 아래로 묶입니다. |
| `@Get()`, `@Post()`, `@Put()`, `@Delete()`: HTTP 메서드 데코레이터 | 조회, 생성, 수정, 삭제 핸들러에 각각 붙였습니다. |
| `@Param()`, `@Body()`: 라우트 파라미터와 요청 본문 추출 | `@Param('id', ParseIntPipe) id`, `@Body() updateCatDto` |
| `@HttpCode()`: 응답 상태 코드 지정 | 삭제 성공 시 본문 없이 `@HttpCode(204)` |

## 핸들러와 라우트

| 핸들러 | 데코레이터 | 요청 | 받는 값 |
| --- | --- | --- | --- |
| `findAll` | `@Get()` | `GET /cats` | 없음 |
| `findOne` | `@Get(':id')` | `GET /cats/:id` | `@Param('id', ParseIntPipe) id` |
| `createOne` | `@Post('create')` | `POST /cats/create` | `@Body() CreateCatDto` |
| `update` | `@Put(':id')` | `PUT /cats/:id` | `@Param('id', ParseIntPipe) id`, `@Body() UpdateCatDto` |
| `deleteOne` | `@Delete(':id')`, `@HttpCode(204)` | `DELETE /cats/:id` | `@Param('id', ParseIntPipe) id` |

## 구현하며 확인한 점

- `@Body()`를 빠뜨린 인자는 값이 주입되지 않아 컨트롤러와 서비스 양쪽에서 `undefined`가 됩니다. 타입 표기만으로는 아무 값도 채워지지 않습니다.
- `@Get(':id')`가 `@Get()`보다 먼저 선언돼 있어도 `GET /cats`와 `GET /cats/1`은 경로 구조가 달라 서로 가로채지 않고 각각 정상 동작합니다.

## 코드

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

## 참고 문서

- [NestJS 한글 문서](https://nestjs.burt.pe.kr/) 홈에서 `Overview › Controllers` 메뉴
