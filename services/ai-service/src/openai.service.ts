import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenaiService {
  private api = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

  async complete(prompt: string) {
    const res = await this.api.createCompletion({ model: 'text-davinci-003', prompt });
    return res.data.choices[0].text;
  }
}
