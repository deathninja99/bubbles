const {
  client,
  getAllUsers,
  createUser,
  updateUser,
  updatePost,
  createPost,
  getAllPosts,
  getPostsByUser,
  getUserById,
} = require("./index");

async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
        DROP TABLE IF EXISTS tags, post_tags, posts, users
      `);

    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!");
    throw error;
  }
}

async function createTables() {
  try {
    console.log("Starting to build tables...");

    await client.query(`

        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username varchar(255) UNIQUE NOT NULL,
          password varchar(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT true
        );

        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          "authorId" INTEGER REFERENCES users(id),
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          active BOOLEAN DEFAULT true
          );

          CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );

        CREATE TABLE post_tags (
          "postId" INTEGER REFERENCES posts(id),
          "tagId" INTEGER REFERENCES tags(id),
          UNIQUE ("postId", "tagId")  
          );
      `);

    console.log("creatingTagTable");
    console.log("postsTagsTable");

    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!");
    throw error;
  }
}
async function createTags(tagList) {
  if (tagList.length === 0) {
    return;
  }

  // need something like: $1), ($2), ($3
  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");
  // then we can use: (${ insertValues }) in our string template

  // need something like $1, $2, $3
  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");
  // then we can use (${ selectValues }) in our string template

  try {
    // insert the tags, doing nothing on conflict
    // returning nothing, we'll query after
    await client.query(
      `
    INSERT INTO tags(name)
    VALUES (${insertValues})
    ON CONFLICT (name) DO NOTHING;
    `,
      tagList
    );

    // select all tags where the name is in our taglist
    // return the rows from the query
    const { rows } = await client.query(
      `
    SELECT * FROM tags
    WHERE name
    IN  (${selectValues});`,
      tagList
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function createInitialUsers() {
  try {
    // console.log("Starting to create users...");

    const sandra = await createUser({
      username: "sandra",
      password: "12345678",
      name: "Just Sandra",
      location: "Ain't tellin",
    });
    const glamgal = await createUser({
      username: "glamgal",
      password: "12345678",
      name: "Joshua",
      location: "Upper East side",
    });
    // console.log(sandra);
    // console.log(glamgal);

    // console.log("Finished creating users!");
  } catch (error) {
    // console.error("Error creating users!");
    throw error;
  }
}

async function createInitialPost() {
  // console.log("creating initial posts");
  try {
    const post1 = await createPost({
      authorId: 1,
      title: "a great title",
      content: "we did it",
    });
    // console.log(post1);
    // console.log("finished creating posts");
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    // await createPostsTable();
    await createInitialUsers();
    await createInitialPost();
    await updateUser(1, { username: "andy" });

    // console.log("updating posts");
    await updatePost(1, { content: "lorem ipsum" });
    await getPostsByUser(1);
    await getUserById(1);
    await createTags(["tagList", "tag2"]);
  } catch (error) {
    throw error;
  }
}

async function testDB() {
  try {
    // console.log("Starting to test database...");

    // console.log("Calling getAllUsers");
    const users = await getAllUsers();
    // console.log("Result:", users);

    // console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    // console.log("Result:", updateUserResult);
    // console.log("calling getAllPosts")
    const posts = await getAllPosts();
    // console.log("posts:", posts)
    // console.log("Finished database tests!");
  } catch (error) {
    console.error("Error testing database!");
    throw error;
  }
}

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
