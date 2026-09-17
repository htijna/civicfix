import { validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation failed:', errors.array());
    const firstMsg = errors.array()[0]?.msg;
    return res.status(422).json({
      message: firstMsg && firstMsg !== 'Invalid value' ? firstMsg : 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}
