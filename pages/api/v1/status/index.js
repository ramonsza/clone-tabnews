function status(request, response) {
  response.status(200).send({ chave: "apenas uma frase, exclamação" });
}

export default status;
