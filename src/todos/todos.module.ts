import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { CatsModule } from 'src/cats/cats.module';

@Module({
  imports: [CatsModule],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
