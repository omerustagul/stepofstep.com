
export const isValidName = (name: string): boolean => {
    // Allows letters, spaces, and common accents. No numbers or special symbols like @, #, etc.
    const nameRegex = /^[a-zA-Z\s\u00C0-\u017F]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
};

export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
    // Accepts international format starting with +, or digits only, length 10-15
    const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s.-]{7,15}$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};
