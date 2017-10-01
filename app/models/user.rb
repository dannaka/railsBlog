class User < ApplicationRecord
  before_save {self.email = email.downcase}

  validates :name, presence: true, length: {maximum: 50}

  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i
  validates :email, presence: true, length: { maximum: 255 },
                    format: { with: VALID_EMAIL_REGEX },
                    uniqueness: {case_sensitive: false}

  validates :password, presence: true, length: {minimum: 6}

  # has_secure_password makes User accesable with password
  # and password_confirmation attributes.
  # these attributes have some validation rules
  # (presence and equal to each other)
  # But, Note that these validation rules is checked only
  # when creating new User(s)
  has_secure_password
end
