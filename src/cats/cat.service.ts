import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CatDto, UpdateCatDto } from './dto/cats.dto';

@Injectable()
export class CatsService {
  private readonly cats: CatDto[] = [
    { id: 1, name: '나비', pet: '쓰다듬기', state: '입양' },
    { id: 2, name: '동동', pet: '밥주기', state: '키우는 중' },
    { id: 3, name: '소이', pet: '산책하기', state: '입양' },
    { id: 4, name: '지리', pet: '쓰다듬기', state: '키우는 중' },
    { id: 5, name: '얌이', pet: '쓰다듬기', state: '키우는 중' },
  ];

  findOne(id: number) {
    const cat = this.cats.find((d) => d.id === id);
    if (!cat) {
      throw new NotFoundException(`Cat #${id} not found`);
    }
    return cat;
  }

  findAll() {
    return this.cats;
  }

  update(id: number, updateCatDto: UpdateCatDto) {
    const cat = this.cats.find((d) => d.id === id);
    if (!cat) {
      throw new NotFoundException(`Cat #${id} not found`);
    }

    Object.assign(cat, updateCatDto);
    return cat;
  }

  create(cat: CatDto) {
    console.log('cat', cat);
    const validation = this.cats.find((c) => c.id === cat.id);

    console.log(validation);
    if (validation) {
      throw new ConflictException('conflict!');
    }

    this.cats.push(cat);
    return this.cats;
  }

  delete(id: number) {
    const index = this.cats.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Not Found #${id}`);
    }
    this.cats.splice(index, 1);
  }
}
