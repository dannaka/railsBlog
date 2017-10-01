require 'test_helper'

class ApplicationHelperTest < ActionView::TestCase
  test "full title helper" do
    assert_equal full_title, "Blue Balloon Blog"
    assert_equal full_title("Contact"), "Contact | Blue Balloon Blog"
  end
end
