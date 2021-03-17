/**
 * boxes
 * Copyright (C) 2021  Rui Vieira
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export type Environment = { [p: string]: string };

interface Entry {
  render(): string;
}

export class Base implements Entry {
  public readonly from: string;
  public readonly tag: string;

  constructor(from: string, tag: string = "latest") {
    this.from = from;
    this.tag = tag;
  }

  render(): string {
    return `FROM ${this.from}:${this.tag}`;
  }
}

export class Command implements Entry {
  private commands: string[] = [];

  constructor() {
  }

  add(cmd: string): Command {
    this.commands.push(cmd);
    return this;
  }

  render(): string {
    const c = this.commands.map((c) => `"${c}"`).join(", ");
    return `CMD [${c}]`;
  }
}

export class Env implements Entry {
  constructor() {
  }

  private _envs: Environment = {};

  get envs(): Environment {
    return this._envs;
  }

  add(key: string, value: string): Env {
    this._envs[key] = value;
    return this;
  }

  render(): string {
    const result = [];
    for (const key of Object.keys(this._envs)) {
      result.push(`ENV ${key}=${this._envs[key]}`);
    }
    return result.join("\n");
  }
}

export class Port implements Entry {
  public readonly port: number;

  constructor(port: number) {
    this.port = port;
  }

  render(): string {
    return `EXPOSE ${this.port}`;
  }
}

export class Workdir implements Entry {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  render(): string {
    return `WORKDIR ${this.dir}`;
  }
}

export class User implements Entry {
  private readonly user: string;

  constructor(user: string) {
    this.user = user;
  }

  render(): string {
    return `USER ${this.user}`;
  }
}

export class Copy implements Entry {
  private readonly source: string;
  private readonly dest: string;

  constructor(source: string, dest: string) {
    this.source = source;
    this.dest = dest;
  }

  render(): string {
    return `COPY ${this.source} ${this.dest}`;
  }
}

export class Add implements Entry {
  private readonly source: string;
  private readonly dest: string;

  constructor(source: string, dest: string) {
    this.source = source;
    this.dest = dest;
  }

  render(): string {
    return `ADD ${this.source} ${this.dest}`;
  }
}

export class Run implements Entry {
  private readonly command: string;

  constructor(command: string) {
    this.command = command;
  }

  render(): string {
    return `RUN ${this.command}`;
  }
}

export class Container {
  public readonly base: Base;
  private readonly _ports: Port[] = [];

  constructor(base: Base | string, tag?: string) {
    if (base instanceof Base) {
      this.base = base;
    } else {
      this.base = new Base(base, tag == undefined ? "latest" : tag!);
    }
    this._entries.push(this.base);
  }

  get ports(): Port[] {
    return this._ports;
  }

  private _entries: Entry[] = [];

  get entries(): Entry[] {
    return this._entries;
  }

  env(key: string, value: string): Container {
    const env = new Env();
    env.add(key, value);
    this._entries.push(env);
    return this;
  }

  cmd(...args: string[]): Container {
    const command = new Command();
    args.forEach((x) => command.add(x));
    this._entries.push(command);
    return this;
  }

  run(data: string): Container {
    this._entries.push(new Run(data));
    return this;
  }

  add(source: string, dest: string): Container {
    this._entries.push(new Add(source, dest));
    return this;
  }

  copy(source: string, dest: string): Container {
    this._entries.push(new Copy(source, dest));
    return this;
  }

  user(data: string): Container {
    this._entries.push(new User(data));
    return this;
  }

  workdir(data: string): Container {
    this._entries.push(new Workdir(data));
    return this;
  }

  port(data: number): Container {
    const port = new Port(data);
    this._entries.push(port);
    this._ports.push(port);
    return this;
  }

  render(): string {
    const manifest = this._entries.map((x) => x.render());
    return manifest.join("\n");
  }
}
