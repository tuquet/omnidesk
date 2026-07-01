import businessLogic from '../business/index.js';

export default function (context, message) {
  return businessLogic(context, message);
}
