import jwt from 'jsonwebtoken';
export const generateAccessToken = ({ id }) => {
    return jwt.sign({ _id: id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
};
export const genereateRefreshToken = ({ id }) => {
    return jwt.sign({ _id: id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
};
