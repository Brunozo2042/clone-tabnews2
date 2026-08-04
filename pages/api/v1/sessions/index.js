import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication";
import authorization from "models/authorization";
import session from "models/session";

import { ForbiddenError } from "infra/errors";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("create:session"), postHandler)
  .delete(deleteHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const autheticatedUser = await authentication.getUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(autheticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não tem permissão para criar uma sessão.",
      action: "Verifique se está logado com as credenciais corretas.",
    });
  }

  const newSession = await session.create(autheticatedUser.id);

  controller.setSessionCookie(newSession.token, response);

  const secureOutputValues = authorization.filterOutput(
    autheticatedUser,
    "read:session",
    newSession,
  );

  return response.status(201).json(secureOutputValues);
}

async function deleteHandler(request, response) {
  const userTryingToDelete = request.context.user;
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionObject.id);
  controller.clearSessionCookie(response);

  const secureOutputValues = authorization.filterOutput(
    userTryingToDelete,
    "read:session",
    expiredSession,
  );

  return response.status(200).json(secureOutputValues);
}
