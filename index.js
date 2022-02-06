const { connect, model, Schema, Types } = require("mongoose");
const { MONGO_URI_DEV } = process.env;

(async () => {
  try {
    await connect(MONGO_URI_DEV);
    console.log("mongodb connected...");
    await User.create({
      email: "bob@example.com",
      wallet: 1,
    });
  } catch (err) {
    console.error("mongodb failed to connect", err);
  }
})();

const User = model(
  "Users",
  new Schema({
    email: { type: String, unique: true },
    wallet: Number,
  })
);

const Transaction = model(
  "Transactions",
  new Schema({
    userId: { type: Types.ObjectId, ref: "Users" },
    amount: Number,
    type: String,
  })
);

async function updateWallet(email, amount) {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const opts = { session };
    const user = await User.findOneAndUpdate(
      { email },
      { $inc: { wallet: amount } },
      opts
    );

    await Transaction({
      userId: user._id,
      amount,
      type: "credit",
    }).save(opts);

    await session.commitTransaction();
    session.endSession();
    return true;
  } catch (error) {
    // If an error occurred, abort the whole transaction and
    // undo any changes that might have happened
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

updateWallet("bob@example.com", 500);
