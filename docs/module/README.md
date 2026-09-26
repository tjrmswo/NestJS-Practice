# 모듈 (Module)

[← 개념 문서 목록](../../README.md#개념-문서)

## 왜 필요한가

NestJS는 파일을 자동으로 스캔하지 않습니다. 모듈에 명시적으로 등록된 컨트롤러와 프로바이더만 인식하고, 모듈은 한 기능(여기서는 cats)에 필요한 조각을 하나로 묶는 조립 단위 역할을 합니다. 컨트롤러와 서비스 파일을 만들어 두어도 모듈에 등록하지 않으면 라우트가 만들어지지 않습니다.

## 개념과 실제 적용

| 개념 | Cats 도메인 적용 |
| --- | --- |
| `controllers`: 모듈이 처리할 컨트롤러 | `controllers: [CatsController]`로 등록해야 `/cats` 라우트가 생성됩니다. |
| `providers`: 모듈 안에서 주입할 수 있는 프로바이더 | `providers: [CatsService]` |
| `exports`: 다른 모듈에 공개할 프로바이더 | `exports: [CatsService]`로 공개했습니다. 아직 다른 모듈에서 주입해 쓰는 곳은 없습니다. |
| 루트 모듈의 `imports`로 모듈 트리를 연결 | `CatsModule`은 `AppModule`에 직접 등록하지 않고 `TodosModule`의 `imports`를 통해 간접적으로 로드됩니다. |

### 현재 모듈 트리

```
AppModule
└── TodosModule
    └── CatsModule
```

## 등록 단계

기능 하나를 앱에 연결하려면 다음 순서로 등록합니다.

1. 서비스(프로바이더)와 컨트롤러 클래스를 작성합니다.
2. 모듈의 `@Module()`에서 `controllers`, `providers`에 각각 등록합니다.
3. 다른 모듈에서 그 프로바이더를 써야 한다면 `exports`에도 추가합니다.
4. 앱의 모듈 트리(루트 모듈에서 이어지는 `imports`)에 이 모듈을 연결합니다.

## 구현하며 확인한 점

컨트롤러와 서비스 파일을 만들어도 모듈의 `controllers`/`providers`에 등록하지 않으면 라우트가 존재하지 않아, 어떤 요청을 보내도 404가 됩니다. 클래스를 만드는 일과 앱에 등록하는 일은 별개의 단계입니다.

## 코드

```ts
// src/cats/cats.module.ts
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

## 참고 문서

- [NestJS 한글 문서](https://nestjs.burt.pe.kr/) 홈에서 `Overview › Modules` 메뉴
