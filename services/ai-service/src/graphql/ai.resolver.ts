import { Query, Mutation, Resolver, Args } from '@nestjs/graphql';

@Resolver()
export class AiResolver {
  @Query(() => String)
  hello() {
    return 'hello';
  }
}
