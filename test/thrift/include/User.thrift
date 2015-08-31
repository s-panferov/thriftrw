include "Profile.thrift"

struct User {
  1: required string name
  2: optional Profile.Profile profile,
}
