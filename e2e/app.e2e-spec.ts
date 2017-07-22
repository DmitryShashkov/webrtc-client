import { RTCPage } from './app.po';

describe('rtc App', () => {
  let page: RTCPage;

  beforeEach(() => {
    page = new RTCPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
