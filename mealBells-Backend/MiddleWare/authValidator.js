import Joi from 'joi';


export const signUpValidator = (req, res, next) => {

    const schema = Joi.object({

        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(100).required().custom((value, helper) => {

            if (value[0] !== value[0].toUpperCase()) {

                return helper.message("First Letter of Password Should Be Uppercase");

            }
            return value;

        })


    })

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();

};

export const loginValidator = (req, res, next) => {

    const schema = Joi.object({

        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(100).required().custom((value, helper) => {
            if (value[0] !== value[0].toUpperCase()) {
                return helper.message("First Letter of Password Should Be Uppercase");
            }
            return value;
        })


    })

    const {error}= schema.validate(req.body);

    if(error){
      return   res.status(400).json({msg:error.details[0].message});
    }

    next();

};