import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnounymousOrUser);
router.post(controller.canRequest("create:user"), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  // 1. Criar token de ativação
  const activationToken = await activation.create(newUser.id);
  // 2. Enviar token por email
  await activation.sendEmailToUser(newUser, activationToken);

  return response.status(201).json(newUser);
}
