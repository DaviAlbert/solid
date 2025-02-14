"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/app.ts
var app_exports = {};
__export(app_exports, {
  app: () => app
});
module.exports = __toCommonJS(app_exports);
var import_fastify = __toESM(require("fastify"));

// src/http/controllers/register.ts
var import_zod2 = require("zod");

// src/use-cases/register.ts
var import_bcryptjs = require("bcryptjs");

// src/use-cases/errors/user-alredy-exists-error.ts
var UserAlreadyExistsError = class extends Error {
  constructor() {
    super("E-mail already exists.");
  }
};

// src/use-cases/register.ts
var RegisterUseCase = class {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  async execute({ name, email, password }) {
    const password_hash = await (0, import_bcryptjs.hash)(password, 6);
    const userWithSameEmail = await this.usersRepository.findByEmail(email);
    if (userWithSameEmail) {
      throw new UserAlreadyExistsError();
    }
    const user = await this.usersRepository.create({ name, email, password_hash });
    return { user };
  }
};

// src/env/index.ts
var import_config = require("dotenv/config");
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["dev", "test", "production"]).default("dev"),
  JWT_SECRET: import_zod.z.string(),
  PORT: import_zod.z.coerce.number().default(3333)
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("\u274C Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables.");
}
var env = _env.data;

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: env.NODE_ENV === "dev" ? ["query"] : []
});

// src/repositories/prisma/prisma-users-repository.ts
var PrismaUsersRepository = class {
  async findById(id) {
    const user = await prisma.user.findUnique({
      where: {
        id
      }
    });
    return user;
  }
  async findByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  }
  async create(data) {
    const user = await prisma.user.create({ data });
    return user;
  }
};

// src/http/controllers/register.ts
async function register(request, reply) {
  const registerBodySchema = import_zod2.z.object({
    name: import_zod2.z.string(),
    email: import_zod2.z.string().email(),
    password: import_zod2.z.string().min(6)
  });
  const { name, email, password } = registerBodySchema.parse(request.body);
  try {
    const usersRepository = new PrismaUsersRepository();
    const registerUseCase = new RegisterUseCase(usersRepository);
    await registerUseCase.execute({ name, email, password });
  } catch (err) {
    if (err instanceof UserAlreadyExistsError) {
      return reply.status(409).send({ message: err.message });
    }
    throw err;
  }
  return reply.status(201).send();
}

// src/http/controllers/authenticate.ts
var import_zod3 = require("zod");

// src/use-cases/errors/invalid-credentials-error.ts
var InvalidCredentialsError = class extends Error {
  constructor() {
    super("Invalid credentials.");
  }
};

// src/use-cases/authenticate.ts
var import_bcryptjs2 = require("bcryptjs");
var AuthenticateUseCase = class {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  async execute({ email, password }) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const doestPasswordMatches = await (0, import_bcryptjs2.compare)(password, user.password_hash);
    if (!doestPasswordMatches) {
      throw new InvalidCredentialsError();
    }
    return { user };
  }
};

// src/http/controllers/authenticate.ts
async function authenticate(request, reply) {
  const authenticateBodySchema = import_zod3.z.object({
    email: import_zod3.z.string().email(),
    password: import_zod3.z.string().min(6)
  });
  const { email, password } = authenticateBodySchema.parse(request.body);
  try {
    const usersRepository = new PrismaUsersRepository();
    const authenticateUseCase = new AuthenticateUseCase(usersRepository);
    const { user } = await authenticateUseCase.execute({ email, password });
    const token = await reply.jwtSign(
      {},
      {
        sign: {
          sub: user.id
        }
      }
    );
    return reply.status(200).send({
      token
    });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return reply.status(400).send({ message: err.message });
    }
    throw err;
  }
}

// src/use-cases/errors/resource-not-found-error.ts
var ResourceNotFoundError = class extends Error {
  constructor() {
    super("Resource not found.");
  }
};

// src/use-cases/get-user-profile.ts
var GetUserProfileUseCase = class {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  async execute({
    userId
  }) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError();
    }
    return {
      user
    };
  }
};

// src/use-cases/factories/make-get-user-profile-use.case.ts
function makeGetUserProfileUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const useCase = new GetUserProfileUseCase(usersRepository);
  return useCase;
}

// src/http/controllers/profile.ts
async function profile(request, reply) {
  const getUserProfile = makeGetUserProfileUseCase();
  const { user } = await getUserProfile.execute({
    userId: request.user.sub
  });
  return reply.status(200).send({ user: { ...user, password_hash: void 0 } });
}

// src/http/middlewares/verify-jwt.ts
async function verifyJwt(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ message: `Unauthorized: ${err}` });
  }
}

// src/http/routes.ts
async function appRoutes(app2) {
  app2.post("/users", register);
  app2.post("/sessions", authenticate);
  app2.get("/me", { onRequest: [verifyJwt] }, profile);
}

// src/app.ts
var import_zod4 = require("zod");
var import_jwt = __toESM(require("@fastify/jwt"));
var app = (0, import_fastify.default)();
app.register(import_jwt.default, {
  secret: env.JWT_SECRET
});
app.setErrorHandler((error, _, reply) => {
  if (error instanceof import_zod4.ZodError) {
    return reply.status(400).send({ message: "Validation error.", issues: error.format() });
  }
  if (env.NODE_ENV !== "production") {
    console.error(error);
  }
  return reply.status(500).send({ message: "Internal server error." });
});
app.register(appRoutes);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
