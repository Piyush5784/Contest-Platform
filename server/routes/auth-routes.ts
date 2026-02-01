import { PrismaClient, Provider, Role } from "@/generated/prisma/client";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/lib/api-response-types";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  loginSchema,
  signInSchema,
  signInSchemaGoogle,
} from "@/lib/req-schemas";
import { PrismaPg } from "@prisma/adapter-pg";
import { JWT_PASSWORD } from "@/config";

const router = express.Router();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const checkSchema = loginSchema.safeParse({ email, password });

//     if (!checkSchema.success) {
//       return res.status(400).json({
//         success: false,
//         data: null,
//         error: "INVALID_REQUEST",
//       } satisfies ApiErrorResponse);
//     }

//     const existingUser = await prisma.user.findFirst({
//       where: {
//         email: email,
//       },
//     });

//     if (!existingUser) {
//       return res.status(401).json({
//         success: false,
//         data: null,
//         error: "INVALID_CREDENTIALS",
//       } satisfies ApiErrorResponse);
//     }

//     const checkPassword = await bcrypt.compare(
//       password,
//       existingUser.password_hash!,
//     );

//     if (!checkPassword) {
//       return res.status(401).json({
//         success: false,
//         data: null,
//         error: "INVALID_CREDENTIALS",
//       } satisfies ApiErrorResponse);
//     }

//     const token = jwt.sign(
//       {
//         id: existingUser.id,
//         email: existingUser.email,
//         role: existingUser.role,
//       },
//       JWT_PASSWORD,
//     );

//     return res.status(200).json({
//       success: true,
//       data: {
//         msg: "User successfully logged in",
//         token,
//       },
//       error: null,
//     } satisfies ApiSuccessResponse);
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({
//       success: false,
//       data: null,
//       error: "SOMETHING_WENT_WRONG",
//     } satisfies ApiErrorResponse);
//   }
// });

// TODO: Role should not be used like this
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let { role } = req.body;
    let role2: null | string = role;

    if (role == "creator") {
      role = Role.CREATOR;
    } else if (role == "contestee") {
      role = Role.CONTESTEE;
    }
    const checkSchema = signInSchema.safeParse({ name, email, password, role });

    if (!checkSchema.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      } satisfies ApiErrorResponse);
    }

    //find already exists, if not, create one return
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "EMAIL_ALREADY_EXISTS",
      } satisfies ApiErrorResponse);
    }

    const password_hash = await bcrypt.hash(password, 13);

    if (!role) {
      role = Role.CONTESTEE;
      role2 = "contestee";
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash,
        name,
        role,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: role2,
        msg: "User successfully created",
      },
      error: null,
    } satisfies ApiSuccessResponse);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      data: null,
      error: "SOMETHING_WENT_WRONG",
    } satisfies ApiErrorResponse);
  }
});

router.post("/google", async (req, res) => {
  try {
    const checkSchema = signInSchemaGoogle.safeParse(req.body);

    if (!checkSchema.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_DATA",
      } satisfies ApiErrorResponse);
    }

    const { name, email, image } = checkSchema.data;

    let user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          provider: Provider.GOOGLE,
          password_hash: null,
        },
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        provider: user.provider,
      },
      error: null,
    } satisfies ApiSuccessResponse);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      data: null,
      error: "SOMETHING_WENT_WRONG",
    } satisfies ApiErrorResponse);
  }
});

router.post("/verify", async (req, res) => {
  try {
    const checkSchema = loginSchema.safeParse(req.body);

    if (!checkSchema.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      } satisfies ApiErrorResponse);
    }

    const { email, password } = checkSchema.data;

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "USER_NOT_FOUND",
      } satisfies ApiErrorResponse);
    }

    if (user.provider !== Provider.CREDENTIALS || !user.password_hash) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID PROVIDER",
      } satisfies ApiErrorResponse);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID PASSWORD",
      } satisfies ApiErrorResponse);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        provider: user.provider,
      },
      error: null,
    } satisfies ApiSuccessResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "SOMETHING_WENT_WRONG",
    } satisfies ApiErrorResponse);
  }
});

export const authRoutes = router;
