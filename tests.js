const assert = require('assert');
const request = require('supertest');
const api = require('.');

const { app } = api;

console.log('MEMORY', api.db());

const getThisAsJson = async url => request(app).get(url).set('Accept', 'application/json');
const postThis = async (url, postdata) => request(app).post(url).send(postdata).set('Accept', 'application/json');
const putThis = async (url, putdata) => request(app).put(url).send(putdata).set('Accept', 'application/json');
const deleteThis = async url => request(app).delete(url).set('Accept', 'application/json');

const assertHeaderContentTypeIsJson = response => {
  assert.strictEqual(/json/.test(response.headers['content-type']), true);
};
const assertLocationHeader = response => {
  // console.log("PPOST1", response.headers);
  assert.match(response.headers.location, /^\/api\/presidents\//);
};

describe('The /presidents API', () => {
  describe('GET many', () => {
    let response = {};
    before(async () => {
      response = await getThisAsJson('/api/presidents/');
    });

    it('returns 200 OK', () => {
      assert.strictEqual(response.status, 200);
    });

    it('returns JSON', () => {
      assertHeaderContentTypeIsJson(response);
    });

    it('returns all presidents in the database', () => {
      assert.strictEqual(response.body.length, api.db().length);
    });
  });

  describe('GET one', () => {
    let response = {};
    before(async () => {
      response = await getThisAsJson('/api/presidents/44');
    });

    it('returns 200 OK', () => {
      assert.strictEqual(response.status, 200);
    });
    it('returns JSON', () => {
      assertHeaderContentTypeIsJson(response);
    });
    it('returns correct president data', () => {
      assert.strictEqual(response.body.name.includes('Barack'), true);
    });
  });

  describe('POST', () => {
    let postResponse = {};
    const testPostData = {
      from: '2020',
      to: '2021',
      name: 'Zach Eriksson',
    };

    before(async () => {
      postResponse = await postThis('/api/presidents', testPostData);
    });

    it('returns 201 Created', () => {
      assert.strictEqual(postResponse.status, 201);
    });
    it('returns JSON', () => {
      assertHeaderContentTypeIsJson(postResponse);
    });

    it('returns correct location header', () => {
      assertLocationHeader(postResponse);
    });

    it('returns the president data', () => {
      assert.strictEqual(postResponse.body.name.includes('Zach'), true);
    });

    describe('handles errors', () => {
      it('returns 4xx empty post data', async () => {
        const failedPostResponse = await postThis('/api/presidents/', {});
        assert.strictEqual(failedPostResponse.statusType, 4);
      });

      describe('for posts with faulty data', () => {
        let failedPostResponse;
        const missingNameData = {
          from: '2020',
          to: '2021',
        };

        before(async () => {
          failedPostResponse = await postThis(
            '/api/presidents/',
            missingNameData,
          );
        });

        it('responds with status 400', async () => {
          assert.strictEqual(failedPostResponse.statusType, 4);
        });

        it('does not store president in the db', async () => {
          assert.equal(api.db().length, 5);
        });
      });
    });
      describe('for posts with other faulty data', () => {
        let failedPostResponse;
        const missingNameData = {
          name: 'Alex the great',
          to: '2021',
        };

        before(async () => {
          failedPostResponse = await postThis(
            '/api/presidents/',
            missingNameData,
          );
        });

        it('responds with status 400', async () => {
          assert.strictEqual(failedPostResponse.statusType, 4);
        });

        it('does not store president in the db', async () => {
          assert.equal(api.db().length, 5);
        });
      });
    });
  });

  describe('PUT', () => {
    const testPutData = {
      from: '2021',
      to: '2029',
      name: 'Joe Biden',
    };
    let putResponse = {};
    before(async () => {
      putResponse = await putThis('/api/presidents/46/', testPutData);
    });

    it('returns a status code starting with 2', () => {
      assert.strictEqual(putResponse.statusType, 2);
    });

    it('returns JSON', () => {
      assertHeaderContentTypeIsJson(putResponse);
    });

    it('updates data in database', () => {
      const found = api.db().find(p => p.name === testPutData.name);
      assert.equal(found.to, '2029');
    });

    describe('handles errors', () => {
      it('returns 4xx empty post data', async () => {
        const failedPutResponse = await putThis('/api/presidents/45/', {});
        assert.strictEqual(failedPutResponse.statusType, 4);
      });
    });
  });

  describe('DELETE', () => {
    let deleteResponse = {};
    before(async () => {
      deleteResponse = await deleteThis('/api/presidents/45/');
    });

    it('returns status code that starts with 2', () => {
      assert.strictEqual(deleteResponse.statusType, 2);
    });
    it('deletes the correct president', () => {
      const found = api.db().find(p => p.id === '45'); assert.strictEqual(found, undefined);
    });

    describe('DELETE one failures', () => {
      let failedDeleteResponse = {};
      before(async () => {
        failedDeleteResponse = await deleteThis('/api/presidents/99999/');
      });

      it('returns status code X04 for non-existing', () => {
        const lastTwo = failedDeleteResponse.status.toString().slice(-2);
        assert.strictEqual(lastTwo, '04');
      });
    });
  });
});
