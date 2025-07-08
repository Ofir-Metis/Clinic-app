import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private api = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async complete(prompt: string) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await openai.completions.create({ model: 'text-davinci-003', prompt });
    return res.choices[0].text;
  }
}
