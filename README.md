# deno-boxes

A small DSL for building Dockerfiles or Docker compose files.

## Usage

Imports are available from:

- deno.land: https://deno.land/x/boxes
- nest.land: https://nest.land/package/boxes

## Examples

### Dockerfile

```typescript
import * as c from "../containers/core.ts";

const base = new c.Base("hayd/alpine-deno", "1.8.1");

const container = new c.Container(base);

container.port(1993)
  .workdir("/app")
  .user("deno")
  .copy("example.js", ".")
  .run("deno cache example.js")
  .add(".", ".")
  .run("deno cache example.js")
  .cmd("run", "-A", "--unstable", "example.js");

console.log(container.render());
```

```dockerfile
FROM hayd/alpine-deno:1.8.1
EXPOSE 1993
WORKDIR /app
USER deno
COPY example.js .
RUN deno cache example.js
ADD . .
RUN deno cache example.js
CMD ["run", "-A", "--unstable", "example.js"]
```

### Composer file

```typescript
import { Base, Container } from "../containers/core.ts";
import { Composer, Service } from "../containers/compose.ts";

const KAFKA_TAG = "0.19.0-kafka-2.5.0";
const KAKFA_FROM = "strimzi/kafka";
const KAKFA_BASE = new Base(KAKFA_FROM, KAFKA_TAG);

const zookeeper = new Container(KAKFA_BASE);
zookeeper.cmd(
  "sh",
  "-c",
  "bin/zookeeper-server-start.sh config/zookeeper.properties",
)
  .port(2181);

const zkService = new Service("zookeeper", zookeeper);
zkService.env("LOG_DIR", "/tmp/");

const kafka = new Container(KAKFA_BASE);
kafka.cmd(
  "sh",
  "-c",
  "bin/kafka-server-start.sh config/server.properties --override listeners=$${KAFKA_LISTENERS} --override advertised.listeners=$${KAFKA_ADVERTISED_LISTENERS} --override zookeeper.connect=$${KAFKA_ZOOKEEPER_CONNECT}",
);
kafka.port(9092);
const kafkaService = new Service("kafka", kafka);

const ksEnv = {
  LOG_DIR: "/tmp/logs",
  KAFKA_ADVERTISED_LISTENERS: "PLAINTEXT://0.0.0.0:9092",
  KAFKA_LISTENERS: "PLAINTEXT://0.0.0.0:9092",
  KAFKA_ZOOKEEPER_CONNECT: "zookeeper:2181",
};

kafkaService.envs(ksEnv).depends_on(zkService);

const composer = new Composer();

composer.add(zkService).add(kafkaService);

console.log(composer.render());
```

```dockerfile
version: "3.1"
services:
		zookeeper:
			image: strimzi/kafka:0.19.0-kafka-2.5.0
			ports:
				- "2181":"2181"
			environment:
				LOG_DIR: /tmp/
		kafka:
			image: strimzi/kafka:0.19.0-kafka-2.5.0
			ports:
				- "9092":"9092"
			environment:
				LOG_DIR: /tmp/logs
				KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://0.0.0.0:9092
				KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
				KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
			depends_on:
				- zookeeper
```
