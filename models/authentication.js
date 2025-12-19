import user from "models/user";
import password from "models/password";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function getAutheticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail, providedPassword);

    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    }

    throw err;
  }

  async function findUserByEmail(providedEmail) {
    let storedUser;
    try {
      storedUser = await user.findOneByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email não confere.",
          action: "Verifique se este dado este correto.",
        });
      }
      throw error;
    }
    return storedUser;
  }

  async function validatePassword(providedPassword, storedPassword) {
    const passwordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!passwordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se este dado este correto.",
      });
    }
  }
}

const authentication = {
  getAutheticatedUser,
};

export default authentication;
