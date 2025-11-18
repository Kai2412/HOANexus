/**
 * Password Generation Utility
 * Generates secure temporary passwords for new user accounts
 */

/**
 * Generates a random temporary password
 * Format: [Word][Number][SpecialChar][Word][Number]
 * Example: "TempPass123!"
 * 
 * @returns {string} A secure temporary password
 */
function generateTempPassword() {
  // Word list for readable passwords
  const words = ['Temp', 'Welcome', 'New', 'Start', 'Access'];
  const numbers = '0123456789';
  const specialChars = '!@#$%';
  
  // Random word
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  
  // Random number (2 digits)
  const num1 = numbers[Math.floor(Math.random() * numbers.length)] + 
               numbers[Math.floor(Math.random() * numbers.length)];
  const num2 = numbers[Math.floor(Math.random() * numbers.length)] + 
               numbers[Math.floor(Math.random() * numbers.length)];
  
  // Random special character
  const special = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Combine: Word + Number + Special + Word + Number
  return `${word1}${num1}${special}${word2}${num2}`;
}

/**
 * Generates a more complex random password
 * Format: Random alphanumeric + special characters
 * Length: 12-16 characters
 * 
 * @returns {string} A secure random password
 */
function generateRandomPassword() {
  const length = 12 + Math.floor(Math.random() * 5); // 12-16 chars
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

module.exports = {
  generateTempPassword,
  generateRandomPassword
};

