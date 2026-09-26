# 프로바이더와 의존성 주입 (Provider & DI)

[← 개념 문서 목록](../../README.md#개념-문서)

## 왜 필요한가

객체를 직접 `new`로 만들지 않고 컨테이너가 생성해 주입하면 클래스 사이의 결합도가 낮아지고, 테스트에서 대체하기도 쉬워집니다. 프로바이더는 기본적으로 싱글턴이라 인스턴스 하나가 앱 전체에서 공유되므로, 서비스 필드에 상태를 둘 수 있습니다. DB를 연결하기 전에는 이 성질을 이용해 서비스의 배열 필드를 저장소로 씁니다.

## 개념과 실제 적용

| 개념 | Cats 도메인 적용 |
| --- | --- |
| `@Injectable()`: 컨테이너가 관리하는 클래스 표시 | `CatsService`에 붙였습니다. |
| 생성자 주입: 타입을 보고 의존성을 해석 | `constructor(private readonly catsService: CatsService) {}` |
| 모듈의 `providers`에 등록해야 주입 가능 | `CatsModule`의 `providers: [CatsService]` |
| 기본 스코프는 싱글턴 (앱 전체에 인스턴스 1개) | `private readonly cats` 필드가 요청 사이에 유지되어 인메모리 저장소 역할을 합니다. 서버를 재시작하면 초기 데이터 5건으로 돌아갑니다. |

## 인메모리 저장소에서 쓰는 배열 메서드

`cats`는 `readonly`라 다른 배열로 재할당할 수는 없지만 내용은 바꿀 수 있습니다. 저장이 되려면 원본을 직접 바꾸는 메서드를 써야 합니다.

| 메서드 | 하는 일 | 원본을 바꾸나 | 쓰인 곳 |
| --- | --- | --- | --- |
| `find` | 조건에 맞는 첫 원소 찾기 | 아니오 | `findOne`, `update`, `create`(중복 확인) |
| `findIndex` | 조건에 맞는 원소의 위치 찾기 | 아니오 | `delete` |
| `push` | 배열 끝에 추가 | 예 | `create` |
| `splice` | 위치를 기준으로 제거 | 예 | `delete` |
| `Object.assign` | 객체의 필드를 덮어쓰기 | 예 (대상 객체) | `update` |
| `concat`, `filter` | 새 배열을 만들어 반환 | 아니오 | 사용하지 않음 |

## 구현하며 확인한 점

`concat`과 `filter`는 새 배열을 반환할 뿐 원본을 바꾸지 않습니다. 이 결과를 `this.cats`에 다시 담지 않으면 응답에는 변경된 값이 보여도 다시 조회하면 원래대로입니다. 그래서 생성은 `push`, 삭제는 `splice`, 수정은 `Object.assign`으로 원본을 직접 바꿉니다.

## 코드

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

## 참고 문서

- [NestJS 한글 문서](https://nestjs.burt.pe.kr/) 홈에서 `Overview › Providers` 메뉴
- 싱글턴 스코프: 같은 홈에서 `Fundamentals › Injection scopes` 메뉴
