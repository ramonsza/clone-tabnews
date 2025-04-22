import bcrypjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcrypjs.hash(password, rounds);
}

function getNumberOfRounds() {
  let rounds = 1;

  if (process.env.NODE_ENV === "production") {
    rounds = 14;
  }

  return rounds;
}

async function compare(providedPassword, storedPassword) {
  return await bcrypjs.compare(providedPassword, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
