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

import { Container, Env, Environment, Port } from "./core.ts";

export class Composer {
  private services: Service[] = [];
  private readonly version: string;

  constructor(version: string = "3.1") {
    this.version = version;
  }

  add(service: Service): Composer {
    this.services.push(service);
    return this;
  }

  render(): string {
    const script: string[] = [];
    script.push(`version: "${this.version}"`);
    script.push("services:");
    for (const service of this.services) {
      script.push(service.render());
    }
    return script.join("\n");
  }
}

export class Service {
  private readonly name: string;
  private readonly container: Container;
  private readonly depends: Service[] = [];
  private readonly _env: Env = new Env();

  constructor(name: string, container: Container) {
    this.name = name;
    this.container = container;
  }

  private _ports: [Port, Port][] = [];

  get ports(): [Port, Port][] {
    return this._ports;
  }

  addPorts(a: Port, b: Port) {
    this._ports.push([a, b]);
  }

  env(key: string, value: string): Service {
    this._env.add(key, value);

    return this;
  }

  envs(value: Environment): Service {
    for (const k of Object.keys(value)) {
      this._env.add(k, value[k]);
    }
    return this;
  }

  addPort(p: Port) {
    this._ports.push([p, p]);
  }

  depends_on(other: Service) {
    this.depends.push(other);
  }

  render(): string {
    let script = [`\t\t${this.name}:`];
    script.push(
      `\t\t\timage: ${this.container.base.from}:${this.container.base.tag}`,
    );
    script.push(`\t\t\tports:`);
    if (this._ports.length == 0) {
      this._ports = this.container.ports.map((port) => [port, port]);
    }
    for (const port of this._ports) {
      script.push(`\t\t\t\t- "${port[0].port}":"${port[1].port}"`);
    }

    if (Object.keys(this._env.envs).length > 0) {
      script.push(`\t\t\tenvironment:`);
      for (const key of Object.keys(this._env.envs)) {
        script.push(`\t\t\t\t${key}: ${this._env.envs[key]}`);
      }
    }

    if (this.depends.length > 0) {
      script.push(`\t\t\tdepends_on:`);
      for (const depend of this.depends) {
        script.push(`\t\t\t\t- ${depend.name}`);
      }
    }

    return script.join("\n");
  }
}
