const { User } = require("../../db/models");

const router = require("express").Router();

const STEPS = [
  [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      required: true,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
    },
    {
      name: "bio",
      label: "Bio",
      type: "multiline-text",
    },
  ],
  [
    {
      name: "country",
      label: "Country",
      type: "text",
      required: true,
    },
    {
      name: "receiveNotifications",
      label:
        "I would like to receive email notifications for new messages when I'm logged out",
      type: "yes-no",
      required: true,
    },
    {
      name: "receiveUpdates",
      label: "I would like to receive updates about the product via email",
      type: "yes-no",
      required: true,
    },
  ],
];

const methodNotAllowed = (req, res, next) => {
  return res.header("Allow", "GET, POST").sendStatus(405);
};

const getOnboarding = async (req, res, next) => {

  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    return res.status(200).json({ steps: STEPS });
  } catch (error) {
    next(error);
  }
};


const postOnboarding = async (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized, You have to login first." });
  }

  try {
    const user = await User.findOne({
      where: {
        id: req?.user?.id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found!!' });
    }

    const { steps } = req.body;

    for (const stepGroup of steps) {
      for (const step of stepGroup) {
        const { name, value } = step;

        if (!user.dataValues.hasOwnProperty(name)) {
          return res.status(400).json({ error: `Invalid field: ${name}` });
        }

        if (typeof value !== "string" && typeof value !== "boolean") {
          return res.status(400).json({ error: `Invalid data type for field ${name}` });
        }

        user[name] = value;
      }
    }

    if (user.completedOnboarding) {
      return res.status(400).json({ error: "User's onboarding information can only be set once" });
    }

    user.completedOnboarding = true;

    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




router.route("/")
  .get(getOnboarding)
  .post(postOnboarding)
  .all(methodNotAllowed);

module.exports = router;
