import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CatsService } from './cat.service';
import { CreateCatDto, UpdateCatDto } from './dto/cats.dto';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catsService.findOne(id);
  }

  @Get()
  findAll() {
    return this.catsService.findAll();
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCatDto: UpdateCatDto,
  ) {
    return this.catsService.update(id, updateCatDto);
  }

  @Post('create')
  createOne(@Body() createCatDto: CreateCatDto) {
    console.log('create', createCatDto);
    return this.catsService.create(createCatDto);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteOne(@Param('id', ParseIntPipe) id: number) {
    this.catsService.delete(id);
  }
}
