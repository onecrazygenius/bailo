from __future__ import annotations

from typing import Any

from bailo.core import Client, ModelVisibility
from semantic_version import Version

from .release import Release


class Model:
    """Represents a model within Bailo

    :param client: A client object used to interact with Bailo
    :param name: Name of model
    :param description: Description of model
    :param visibility: Visibility of model, using ModelVisibility enum (e.g Public or Private), defaults to None
    """
    def __init__(
        self,
        client: Client,
        model_id: str,
        name: str,
        description: str,
        visibility: ModelVisibility = None,
    ) -> None:

        self.client = client

        self.model_id = model_id
        self.name = name
        self.description = description
        self.visibility = visibility

        self.model_card = None
        self.model_card_version = None
        self.model_card_schema = None

    @classmethod
    def create(
        cls,
        client: Client,
        name: str,
        description: str,
        team_id: str,
        visibility: ModelVisibility = None,
    ) -> Model:
        """Builds a model from Bailo and uploads it

        :param client: A client object used to interact with Bailo
        :param name: Name of model
        :param description: Description of model
        :param team_id: A unique team ID
        :param visibility: Visibility of model, using ModelVisibility enum (e.g Public or Private), defaults to None
        :return: Model object
        """
        res = client.post_model(
            name=name,
            description=description,
            team_id=team_id,
            visibility=visibility
        )
        model = cls(client=client, model_id=res['model']['id'], name=name, description=description, visibility=visibility)

        model.__unpack(res['model'])

        return model

    @classmethod
    def from_id(cls, client: Client, model_id: str) -> Model:
        """Returns an existing model from Bailo

        :param client: A client object used to interact with Bailo
        :param model_id: A unique model ID
        :return: Model object
        """
        model = cls(client=client, model_id=model_id, name="temp", description="temp")
        res = model.client.get_model(model_id=model_id)
        model.__unpack(res['model'])

        model.get_card_latest()

        return model

    def update(self) -> None:
        """Uploads and retrieves any changes to the model summary on Bailo
        """
        res = self.client.patch_model(model_id=self.model_id, name=self.name, description=self.description, visibility=self.visibility)
        self.__unpack(res['model'])

    def update_model_card(self, model_card: dict[str, Any] = None) -> None:
        """Uploads and retrieves any changes to the model card on Bailo

        :param model_card: Model card dictionary, defaults to None

        ..note:: If a model card is not provided, the current model card attribute value is used
        """
        if model_card is None:
            model_card = self.model_card
        res = self.client.put_model_card(model_id=self.model_id, metadata=model_card)
        self.__unpack_mc(res['card'])

    def card_from_schema(self, schema_id: str) -> None:
        """Creates a model card using a schema on Bailo

        :param schema_id: A unique schema ID
        """
        res = self.client.model_card_from_schema(model_id=self.model_id, schema_id=schema_id)
        self.__unpack_mc(res['card'])

    def card_from_model(self):
        """Copies a model card from a different model (not yet implemented)

        :raises NotImplementedError: Not implemented error
        """
        raise NotImplementedError

    def card_from_template(self):
        """Creates a model card using a template (not yet implemented)

        :raises NotImplementedError: Not implemented error
        """
        raise NotImplementedError

    def get_card_latest(self) -> None:
        """Gets the latest model card from Bailo
        """
        res = self.client.get_model(model_id=self.model_id)
        self.__unpack_mc(res['model']['card'])

    def get_card_revision(self, version: str) -> None:
        """Gets a specific model card revision from Bailo

        :param version: Model card version
        """
        res = self.client.get_model_card(model_id=self.model_id, version=version)
        self.__unpack_mc(res['modelCard'])

    def create_release(self, version: Version | str, notes: str = "", files: list[str] = [], images: list[str] = [], minor: bool = False, draft: bool = True) -> Release:
        """Calls the Release.create method to build a release from Bailo and upload it

        :param version: A semantic version for the release
        :param notes: Notes on release, defaults to ""
        :param files: A list of files for release, defaults to []
        :param images: A list of images for release, defaults to []
        :param minor: Is a minor release?, defaults to False
        :param draft: Is a draft release?, defaults to True
        :return: Release object
        """
        Release.create(client=self.client,
            model_id=self.model_id,
            version=version,
            model_card_version = self.model_card_version,
            notes = notes,
            files = files,
            images = images,
            minor = minor,
            draft = draft
        )

        return self.get_release(version=version)

    def get_releases(self) -> list[Release]:
        """Gets all releases for the model.

        :return: List of Release objects
        """
        res = self.client.get_all_releases(model_id=self.model_id)
        releases = []

        for release in res['releases']:
            releases.append(self.get_release(version=release['semver']))

        return releases

    def get_release(self, version: Version | str) -> Release:
        """Calls the Release.from_version method to return an existing release from Bailo

        :param version: A semantic version for the release
        :return: Release object
        """
        return Release.from_version(self.client, self.model_id, version)

    def get_latest_release(self):
        """Gets the latest release for the model from Bailo

        :return: Release object
        """
        return max(self.get_releases())

    def get_images(self):
        """Gets all model image references for the model

        :return: List of images
        """
        res = self.client.get_all_images(model_id=self.model_id)

        return res['images']

    def get_image(self):
        """Gets a model image reference

        :raises NotImplementedError: Not implemented error
        """
        raise NotImplementedError

    def get_roles(self):
        """Gets all roles for the model

        :return: List of roles
        """
        res = self.client.get_model_roles(model_id=self.model_id)

        return res['roles']

    def get_user_roles(self):
        """Gets all user roles for the model

        :return: List of user roles
        """
        res = self.client.get_model_user_roles(model_id=self.model_id)

        return res['roles']

    def __unpack(self, res):
        self.model_id = res['id']
        self.name = res['name']
        self.description = res['description']

        if res['visibility'] == 'private':
            self.visibility = ModelVisibility.Private
        else:
            self.visibility = ModelVisibility.Public

    def __unpack_mc(self, res):
        self.model_card_version = res['version']
        self.model_card_schema = res['schemaId']

        try:
            self.model_card = res['metadata']
        except:
            self.model_card = None
