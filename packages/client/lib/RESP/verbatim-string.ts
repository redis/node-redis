export class VerbatimString extends String {
  constructor(
    public format: string,
    value: string
  ) {
    super(value);
  }
}
